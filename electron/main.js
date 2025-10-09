const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const isDev = process.env.NODE_ENV === 'development'

const THUMBNAIL_SIZE = 200
const PREVIEW_MAX_SIZE = 800

async function generateThumbnail(imagePath) {
  try {
    const image = sharp(imagePath, {
      failOnError: false
    })
    const metadata = await image.metadata()
    const ratio = metadata.width / metadata.height

    let width, height
    if (ratio > 1) {
      width = THUMBNAIL_SIZE
      height = Math.round(THUMBNAIL_SIZE / ratio)
    } else {
      width = Math.round(THUMBNAIL_SIZE * ratio)
      height = THUMBNAIL_SIZE
    }

    const thumbnailBuffer = await image
      .resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .flatten({ background: '#FFFFFF' })
      .toFormat('jpeg', { quality: 85 })
      .toBuffer()

    return thumbnailBuffer.toString('base64')
  } catch (error) {
    console.error('Error generating thumbnail:', error)
    throw new Error(`生成缩略图失败: ${error.message}`)
  }
}

async function generatePreview(imagePath) {
  try {
    const image = sharp(imagePath, {
      failOnError: false
    })
    const metadata = await image.metadata()
    const ratio = metadata.width / metadata.height

    let width, height
    if (ratio > 1) {
      width = PREVIEW_MAX_SIZE
      height = Math.round(PREVIEW_MAX_SIZE / ratio)
    } else {
      width = Math.round(PREVIEW_MAX_SIZE * ratio)
      height = PREVIEW_MAX_SIZE
    }

    // 检查原图是否有透明通道
    const hasAlpha = metadata.channels === 4 || metadata.hasAlpha

    let previewBuffer
    if (hasAlpha) {
      // 保持PNG格式以保留透明度
      previewBuffer = await image
        .resize(width, height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // 透明背景
        })
        .toFormat('png')
        .toBuffer()
    } else {
      // 非透明图片使用JPEG格式
      previewBuffer = await image
        .resize(width, height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .flatten({ background: '#FFFFFF' })
        .toFormat('jpeg', { 
          quality: 90,
          progressive: true
        })
        .toBuffer()
    }

    return previewBuffer.toString('base64')
  } catch (error) {
    console.error('Error generating preview:', error)
    throw new Error(`生成预览图失败: ${error.message}`)
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // 禁用 NodeIntegration
      contextIsolation: true, // 启用 ContextIsolation
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Handle file selection
  ipcMain.handle('select-files', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'tiff'] },
      ],
    })
    return result.filePaths
  })

  // Handle directory selection
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    })
    const dirPath = result.filePaths[0]
    if (dirPath) {
      const files = fs.readdirSync(dirPath)
      const imagePaths = files
        .filter(file => /\.(jpg|jpeg|png|bmp|tiff)$/i.test(file))
        .map(file => path.join(dirPath, file))
      return imagePaths
    }
    return []
  })

  // Handle thumbnail generation
  ipcMain.handle('generate-thumbnail', async (event, imagePath) => {
    try {
      const thumbnail = await generateThumbnail(imagePath)
      return thumbnail
    } catch (error) {
      console.error('Error in generate-thumbnail handler:', error)
      throw error
    }
  })

  // Handle preview generation
  ipcMain.handle('generate-preview', async (event, imagePath) => {
    try {
      const preview = await generatePreview(imagePath)
      return preview
    } catch (error) {
      console.error('Error in generate-preview handler:', error)
      throw error
    }
  })

  // Handle image metadata retrieval
  ipcMain.handle('get-image-metadata', async (event, imagePath) => {
    try {
      const image = sharp(imagePath, { failOnError: false })
      const metadata = await image.metadata()
      return {
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
        format: metadata.format
      }
    } catch (error) {
      console.error('Error getting image metadata:', error)
      throw error
    }
  })

  // Handle saving images
  ipcMain.handle('save-images', async (event, imagesToSave, exportOptions) => {
    // 首先让用户选择输出文件夹
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: '选择输出文件夹',
      buttonLabel: '选择文件夹',
      properties: ['openDirectory']
    })

    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, message: '保存操作已取消' }
    }

    const outputDir = filePaths[0]
    let savedCount = 0
    let errorMessages = []

    for (const imageInfo of imagesToSave) {
      const originalPath = imageInfo.originalPath
      const imageData = Buffer.from(imageInfo.data, 'base64')
      const originalFileName = path.basename(originalPath, path.extname(originalPath))
      const originalDir = path.dirname(originalPath)
      const originalExtension = path.extname(originalPath).toLowerCase()

      // 防止保存到原文件夹
      if (outputDir === originalDir) {
        errorMessages.push(`为防止覆盖原图，无法保存到原文件夹: ${originalFileName}`)
        continue
      }

      // 根据命名规则生成新文件名
      let newFileName = originalFileName
      if (exportOptions.namingRule === 'prefix') {
        newFileName = `${exportOptions.prefix || 'wm_'}${originalFileName}`
      } else if (exportOptions.namingRule === 'suffix') {
        newFileName = `${originalFileName}${exportOptions.suffix || '_watermarked'}`
      }

      // 保持原文件扩展名，如果是PNG数据则使用PNG扩展名
      let outputExtension = originalExtension
      if (!outputExtension || outputExtension === '') {
        outputExtension = '.png' // 默认使用PNG
      }

      const savePath = path.join(outputDir, `${newFileName}${outputExtension}`)

      try {
        // 检查文件是否已存在
        if (fs.existsSync(savePath)) {
          const overwrite = await dialog.showMessageBox(mainWindow, {
            type: 'question',
            buttons: ['覆盖', '跳过', '取消'],
            defaultId: 1,
            message: `文件 "${newFileName}${outputExtension}" 已存在`,
            detail: '您希望如何处理？'
          })
          
          if (overwrite.response === 2) { // 取消
            return { success: false, message: '保存操作已取消' }
          } else if (overwrite.response === 1) { // 跳过
            continue
          }
          // response === 0 表示覆盖，继续执行
        }

        await fs.promises.writeFile(savePath, imageData)
        savedCount++
      } catch (error) {
        console.error(`Error saving image ${originalFileName}:`, error)
        errorMessages.push(`保存图片失败 ${originalFileName}: ${error.message}`)
      }
    }

    if (savedCount > 0) {
      return { 
        success: true, 
        message: `成功保存 ${savedCount} 张图片到 ${outputDir}`, 
        errorMessages 
      }
    } else {
      return { success: false, message: '没有图片被保存。', errorMessages }
    }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})