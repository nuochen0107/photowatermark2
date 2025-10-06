const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
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
      nodeIntegration: true,
      contextIsolation: false,
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
    return result.filePaths[0]
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