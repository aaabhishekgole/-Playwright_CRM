package com.gadgetseva.runner.ui.pickup

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.gadgetseva.runner.data.model.AttachmentDto
import com.gadgetseva.runner.data.model.PickupDetailResponse

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PickupDetailScreen(
    token: String,
    viewModel: PickupViewModel,
    onBack: () -> Unit,
    onOpenCamera: (token: String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var showFailDialog by remember { mutableStateOf(false) }
    var failNote by remember { mutableStateOf("") }
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(token) { viewModel.load(token) }

    LaunchedEffect(uiState.actionSuccess) {
        uiState.actionSuccess?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearActionSuccess()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        uiState.detail?.requestNumber ?: "Pickup Detail",
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF1565C0),
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White
                )
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when {
                uiState.loading && uiState.detail == null -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }

                uiState.error != null && uiState.detail == null -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center).padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = uiState.error ?: "Failed to load",
                            color = MaterialTheme.colorScheme.error
                        )
                        Button(onClick = { viewModel.load(token) }) { Text("Retry") }
                    }
                }

                uiState.detail != null -> {
                    PickupContent(
                        detail = uiState.detail!!,
                        loading = uiState.loading,
                        token = token,
                        onAccept = { viewModel.accept(token) },
                        onMarkPickedUp = { viewModel.markPickedUp(token) },
                        onMarkFailed = { showFailDialog = true },
                        onOpenCamera = { onOpenCamera(token) },
                        onDeletePhoto = { id -> viewModel.deletePhoto(token, id) },
                        onComplete = { viewModel.complete(token) }
                    )
                }
            }
        }
    }

    if (showFailDialog) {
        AlertDialog(
            onDismissRequest = { showFailDialog = false },
            title = { Text("Mark as Failed") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Please provide a reason:")
                    OutlinedTextField(
                        value = failNote,
                        onValueChange = { failNote = it },
                        placeholder = { Text("e.g. Customer not available") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 3
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.markFailed(token, failNote)
                        showFailDialog = false
                        failNote = ""
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) { Text("Confirm") }
            },
            dismissButton = {
                TextButton(onClick = { showFailDialog = false }) { Text("Cancel") }
            }
        )
    }
}

@Composable
private fun PickupContent(
    detail: PickupDetailResponse,
    loading: Boolean,
    token: String,
    onAccept: () -> Unit,
    onMarkPickedUp: () -> Unit,
    onMarkFailed: () -> Unit,
    onOpenCamera: () -> Unit,
    onDeletePhoto: (Long) -> Unit,
    onComplete: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item { StatusBanner(detail.status) }

        detail.customer?.let { c ->
            item {
                SectionCard("👤  Customer") {
                    InfoRow("Name", c.fullName)
                    InfoRow("Phone", c.phone)
                    InfoRow("Email", c.email)
                    InfoRow("Address", c.address)
                }
            }
        }

        detail.device?.let { d ->
            item {
                SectionCard("📱  Device") {
                    InfoRow("Brand / Model", listOfNotNull(d.brand, d.model).joinToString(" ").ifBlank { null })
                    InfoRow("Serial No.", d.serialNumber)
                    InfoRow("IMEI", d.imei)
                }
            }
        }

        detail.issueSummary?.let { issue ->
            item {
                SectionCard("🔧  Issue Reported") {
                    Text(issue, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }

        // Photos
        item {
            val photoCount = detail.attachments?.size ?: 0
            SectionCard("📷  Device Photos ($photoCount / 6)") {
                if (detail.attachments.isNullOrEmpty()) {
                    Text(
                        "No photos uploaded yet. Take at least 1 photo.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        detail.attachments.forEach { att ->
                            PhotoRow(att, onDelete = { onDeletePhoto(att.id) })
                        }
                    }
                }
                if (photoCount < 6) {
                    Spacer(Modifier.height(10.dp))
                    OutlinedButton(
                        onClick = onOpenCamera,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Take Photo (${6 - photoCount} remaining)")
                    }
                }
            }
        }

        // Action buttons
        item {
            ActionSection(
                status = detail.status,
                loading = loading,
                photosCount = detail.attachments?.size ?: 0,
                onAccept = onAccept,
                onMarkPickedUp = onMarkPickedUp,
                onMarkFailed = onMarkFailed,
                onComplete = onComplete
            )
        }
    }
}

@Composable
private fun ActionSection(
    status: String,
    loading: Boolean,
    photosCount: Int,
    onAccept: () -> Unit,
    onMarkPickedUp: () -> Unit,
    onMarkFailed: () -> Unit,
    onComplete: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Actions",
                style = MaterialTheme.typography.labelLarge,
                color = Color(0xFF1565C0),
                fontWeight = FontWeight.Bold
            )

            if (loading) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }

            when (status) {
                "PICKUP_ASSIGNED" -> {
                    Button(
                        onClick = onAccept,
                        enabled = !loading,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1565C0))
                    ) { Text("✅  Accept Pickup", fontWeight = FontWeight.Bold) }
                }

                "PICKUP_IN_PROGRESS" -> {
                    Button(
                        onClick = onMarkPickedUp,
                        enabled = !loading && photosCount >= 1,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32))
                    ) { Text("📦  Mark as Picked Up", fontWeight = FontWeight.Bold) }

                    if (photosCount < 1) {
                        Text(
                            "⚠️ Upload at least 1 photo before marking picked up.",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.error
                        )
                    }

                    OutlinedButton(
                        onClick = onMarkFailed,
                        enabled = !loading,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.error
                        )
                    ) { Text("❌  Mark as Failed") }
                }

                "PICKUP_COMPLETED" -> {
                    Button(
                        onClick = onComplete,
                        enabled = !loading,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1565C0))
                    ) { Text("🏁  Complete Pickup", fontWeight = FontWeight.Bold) }
                }

                else -> {
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = MaterialTheme.shapes.medium,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "Status: ${status.replace("_", " ")}",
                            modifier = Modifier.padding(12.dp),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PhotoRow(attachment: AttachmentDto, onDelete: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (attachment.signedUrl != null) {
            Card(
                modifier = Modifier.size(64.dp),
                shape = MaterialTheme.shapes.medium
            ) {
                AsyncImage(
                    model = attachment.signedUrl,
                    contentDescription = attachment.attachmentType,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            }
        } else {
            Surface(
                modifier = Modifier.size(64.dp),
                shape = MaterialTheme.shapes.medium,
                color = MaterialTheme.colorScheme.surfaceVariant
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text("📷", fontSize = 24.sp)
                }
            }
        }

        Spacer(Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = attachment.attachmentType.replace("_", " "),
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = attachment.fileName,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        IconButton(onClick = onDelete) {
            Icon(
                Icons.Default.Delete,
                contentDescription = "Delete photo",
                tint = MaterialTheme.colorScheme.error
            )
        }
    }
}

@Composable
private fun StatusBanner(status: String) {
    val (containerColor, contentColor) = when {
        status.contains("COMPLETE", ignoreCase = true) ->
            Color(0xFFE8F5E9) to Color(0xFF1B5E20)
        status.contains("FAIL", ignoreCase = true) ||
        status.contains("REJECT", ignoreCase = true) ->
            Color(0xFFFFEBEE) to Color(0xFFB71C1C)
        status.contains("ASSIGN", ignoreCase = true) ->
            Color(0xFFE3F2FD) to Color(0xFF0D47A1)
        else ->
            Color(0xFFF3E5F5) to Color(0xFF4A148C)
    }
    Surface(
        color = containerColor,
        shape = MaterialTheme.shapes.medium,
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            text = "● ${status.replace("_", " ")}",
            modifier = Modifier.padding(12.dp),
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
            color = contentColor
        )
    }
}

@Composable
private fun SectionCard(title: String, content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1565C0)
            )
            Spacer(Modifier.height(10.dp))
            content()
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String?) {
    if (value.isNullOrBlank()) return
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.widthIn(min = 90.dp)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Medium
        )
    }
}
