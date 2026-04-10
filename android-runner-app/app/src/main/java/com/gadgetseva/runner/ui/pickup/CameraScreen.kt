package com.gadgetseva.runner.ui.pickup

import android.content.Context
import android.util.Log
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Camera
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import java.io.File
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CameraScreen(
    token: String,
    viewModel: PickupViewModel,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraExecutor: ExecutorService = remember { Executors.newSingleThreadExecutor() }
    var imageCapture: ImageCapture? by remember { mutableStateOf(null) }
    var capturing by remember { mutableStateOf(false) }
    var captureMessage by remember { mutableStateOf("") }

    DisposableEffect(Unit) {
        onDispose { cameraExecutor.shutdown() }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Take Device Photo", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Black,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White
                )
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color.Black)
        ) {
            // Camera preview
            AndroidView(
                factory = { ctx ->
                    val previewView = PreviewView(ctx)
                    startCamera(ctx, lifecycleOwner, previewView) { capture ->
                        imageCapture = capture
                    }
                    previewView
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.85f)
                    .align(Alignment.TopCenter)
            )

            // Tip overlay
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.TopCenter)
                    .padding(16.dp),
                color = Color.Black.copy(alpha = 0.55f),
                shape = MaterialTheme.shapes.medium
            ) {
                Text(
                    text = "📷  Take 6 photos: Front, Back, Left, Right, Top, Bottom",
                    color = Color.White,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(10.dp)
                )
            }

            // Capture feedback
            if (captureMessage.isNotEmpty()) {
                Surface(
                    modifier = Modifier
                        .align(Alignment.Center)
                        .padding(24.dp),
                    color = Color(0xFF1B5E20).copy(alpha = 0.9f),
                    shape = MaterialTheme.shapes.medium
                ) {
                    Text(
                        text = captureMessage,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp)
                    )
                }
            }

            // Capture button row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 32.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Shutter button
                Surface(
                    onClick = {
                        if (!capturing) {
                            capturing = true
                            captureMessage = ""
                            takePhoto(
                                context = context,
                                imageCapture = imageCapture,
                                executor = cameraExecutor,
                                onPhotoTaken = { file ->
                                    viewModel.uploadPhoto(token, file)
                                    captureMessage = "✅ Photo captured!"
                                    capturing = false
                                    // Auto-go back after a short delay
                                },
                                onError = {
                                    captureMessage = "❌ Capture failed. Try again."
                                    capturing = false
                                }
                            )
                        }
                    },
                    modifier = Modifier.size(76.dp),
                    shape = CircleShape,
                    color = if (capturing) Color.Gray else Color.White,
                    shadowElevation = 8.dp
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        if (capturing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(36.dp),
                                color = Color(0xFF1565C0),
                                strokeWidth = 3.dp
                            )
                        } else {
                            Icon(
                                Icons.Default.Camera,
                                contentDescription = "Capture",
                                modifier = Modifier.size(40.dp),
                                tint = Color(0xFF1565C0)
                            )
                        }
                    }
                }
            }
        }
    }

    // Auto-navigate back after successful upload
    LaunchedEffect(captureMessage) {
        if (captureMessage.startsWith("✅")) {
            kotlinx.coroutines.delay(1200)
            onBack()
        }
    }
}

private fun startCamera(
    context: Context,
    lifecycleOwner: androidx.lifecycle.LifecycleOwner,
    previewView: PreviewView,
    onCapture: (ImageCapture) -> Unit
) {
    val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
    cameraProviderFuture.addListener({
        val cameraProvider = cameraProviderFuture.get()
        val preview = Preview.Builder().build().also {
            it.surfaceProvider = previewView.surfaceProvider
        }
        val imageCapture = ImageCapture.Builder()
            .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
            .build()
        onCapture(imageCapture)
        try {
            cameraProvider.unbindAll()
            cameraProvider.bindToLifecycle(
                lifecycleOwner,
                CameraSelector.DEFAULT_BACK_CAMERA,
                preview,
                imageCapture
            )
        } catch (e: Exception) {
            Log.e("CameraScreen", "Camera bind failed", e)
        }
    }, ContextCompat.getMainExecutor(context))
}

private fun takePhoto(
    context: Context,
    imageCapture: ImageCapture?,
    executor: ExecutorService,
    onPhotoTaken: (File) -> Unit,
    onError: () -> Unit
) {
    val capture = imageCapture ?: run { onError(); return }
    val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(System.currentTimeMillis())
    val photoFile = File(context.cacheDir, "DEVICE_${timestamp}.jpg")
    val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

    capture.takePicture(
        outputOptions,
        executor,
        object : ImageCapture.OnImageSavedCallback {
            override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                onPhotoTaken(photoFile)
            }
            override fun onError(exception: ImageCaptureException) {
                Log.e("CameraScreen", "Photo capture failed", exception)
                onError()
            }
        }
    )
}
