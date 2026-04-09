# Gadget Seva Hub — Pickup Runner Android App

Native Android app for pickup runners using **Kotlin + Jetpack Compose**.
Connects to the existing Spring Boot backend — no backend changes required.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend APIs Used](#backend-apis-used)
3. [Project Setup](#project-setup)
4. [Dependencies — build.gradle.kts](#dependencies--buildgradlekts)
5. [AndroidManifest.xml](#androidmanifestxml)
6. [Network Layer](#network-layer)
   - [ApiService.kt](#apiservicekt)
   - [AuthInterceptor.kt](#authinterceptorkt)
   - [RetrofitClient.kt](#retrofitclientkt)
7. [Data Models](#data-models)
8. [Repository](#repository)
9. [ViewModels](#viewmodels)
10. [UI Screens](#ui-screens)
    - [LoginScreen.kt](#loginscreenkt)
    - [InboxScreen.kt](#inboxscreenkt)
    - [PickupDetailScreen.kt](#pickupdetailscreenkt)
    - [CameraScreen.kt](#camerascreenkt)
11. [Navigation — MainActivity.kt](#navigation--mainactivitykt)
12. [Token Storage — SessionManager.kt](#token-storage--sessionmanagerkt)
13. [Screen Flow Diagram](#screen-flow-diagram)
14. [Build & Run](#build--run)
15. [Environment Config](#environment-config)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Android App (Kotlin)                  │
│                                                         │
│  UI Layer (Jetpack Compose)                             │
│  ├── LoginScreen                                        │
│  ├── InboxScreen        (assigned pickups)              │
│  ├── PickupDetailScreen (accept / status / complete)    │
│  └── CameraScreen       (6-side photo capture)          │
│                                                         │
│  ViewModel Layer (StateFlow + coroutines)               │
│  ├── AuthViewModel                                      │
│  ├── InboxViewModel                                     │
│  └── PickupViewModel                                    │
│                                                         │
│  Repository Layer                                       │
│  └── RunnerRepository                                   │
│                                                         │
│  Network Layer (Retrofit + OkHttp)                      │
│  ├── ApiService          (Retrofit interface)           │
│  ├── AuthInterceptor     (attaches JWT)                 │
│  └── RetrofitClient      (singleton)                    │
│                                                         │
│  Local Storage                                          │
│  └── SessionManager      (EncryptedSharedPreferences)   │
└─────────────────────────────────────────────────────────┘
                          │  REST / JSON
                          ▼
┌─────────────────────────────────────────────────────────┐
│           Spring Boot Backend (existing)                │
│  POST /api/auth/login                                   │
│  GET  /api/mobile/runner/notifications                  │
│  GET  /api/public/pickups/{token}                       │
│  POST /api/public/pickups/{token}/accept                │
│  POST /api/public/pickups/{token}/status                │
│  POST /api/public/pickups/{token}/attachments           │
│  POST /api/public/pickups/{token}/complete              │
└─────────────────────────────────────────────────────────┘
```

**Pattern:** MVVM + Repository  
**Async:** Kotlin Coroutines + StateFlow  
**DI:** Manual (no Hilt — keeps the project simple)

---

## Backend APIs Used

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/login` | None | Get JWT token |
| GET | `/api/mobile/runner/notifications` | JWT Bearer | List assigned pickups |
| GET | `/api/public/pickups/{token}` | None (token-based) | View pickup details |
| POST | `/api/public/pickups/{token}/accept` | None | Accept the pickup job |
| POST | `/api/public/pickups/{token}/status` | None | Update status (picked up / failed) |
| POST | `/api/public/pickups/{token}/attachments` | None | Upload device photo (multipart) |
| DELETE | `/api/public/pickups/{token}/attachments/{id}` | None | Delete a photo |
| POST | `/api/public/pickups/{token}/complete` | None | Mark pickup complete |

---

## Project Setup

### 1. Create Project in Android Studio

```
File → New → New Project → Empty Activity
Name:        GadgetSevaRunner
Package:     com.gadgetseva.runner
Language:    Kotlin
Min SDK:     API 26 (Android 8.0)
Build:       Gradle (Kotlin DSL)
```

### 2. Directory Structure

```
app/src/main/
├── java/com/gadgetseva/runner/
│   ├── data/
│   │   ├── model/
│   │   │   ├── LoginRequest.kt
│   │   │   ├── LoginResponse.kt
│   │   │   ├── NotificationResponse.kt
│   │   │   ├── PickupDetailResponse.kt
│   │   │   └── StatusTransitionRequest.kt
│   │   └── repository/
│   │       └── RunnerRepository.kt
│   ├── network/
│   │   ├── ApiService.kt
│   │   ├── AuthInterceptor.kt
│   │   └── RetrofitClient.kt
│   ├── session/
│   │   └── SessionManager.kt
│   ├── ui/
│   │   ├── auth/
│   │   │   ├── AuthViewModel.kt
│   │   │   └── LoginScreen.kt
│   │   ├── inbox/
│   │   │   ├── InboxViewModel.kt
│   │   │   └── InboxScreen.kt
│   │   └── pickup/
│   │       ├── PickupViewModel.kt
│   │       ├── PickupDetailScreen.kt
│   │       └── CameraScreen.kt
│   ├── navigation/
│   │   └── AppNavigation.kt
│   └── MainActivity.kt
├── res/
│   └── values/
│       ├── strings.xml
│       └── colors.xml
└── AndroidManifest.xml
```

---

## Dependencies — build.gradle.kts

```kotlin
// app/build.gradle.kts

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.gadgetseva.runner"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.gadgetseva.runner"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        // Set your backend base URL here
        buildConfigField("String", "BASE_URL", "\"http://10.0.2.2:8081/\"")
        // For physical device on same WiFi:
        // buildConfigField("String", "BASE_URL", "\"http://192.168.1.100:8081/\"")
        // For production:
        // buildConfigField("String", "BASE_URL", "\"https://api.gadgetsevahub.com/\"")
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // Jetpack Compose BOM
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.9.3")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.8.4")

    // ViewModel + Lifecycle
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")

    // Retrofit + OkHttp (networking)
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Gson (JSON parsing)
    implementation("com.google.code.gson:gson:2.10.1")

    // Encrypted SharedPreferences (secure token storage)
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // CameraX (photo capture)
    implementation("androidx.camera:camera-core:1.4.0")
    implementation("androidx.camera:camera-camera2:1.4.0")
    implementation("androidx.camera:camera-lifecycle:1.4.0")
    implementation("androidx.camera:camera-view:1.4.0")

    // Coil (image loading)
    implementation("io.coil-kt:coil-compose:2.7.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

    // Debug tools
    debugImplementation("androidx.compose.ui:ui-tooling")
}
```

---

## AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Network -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Camera & Storage -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <!-- Camera feature -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.GadgetSevaRunner"
        android:usesCleartextTraffic="true">

        <!-- usesCleartextTraffic=true allows HTTP on emulator.
             Remove this for production (use HTTPS only). -->

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>
```

---

## Network Layer

### ApiService.kt

```kotlin
// network/ApiService.kt
package com.gadgetseva.runner.network

import com.gadgetseva.runner.data.model.LoginRequest
import com.gadgetseva.runner.data.model.LoginResponse
import com.gadgetseva.runner.data.model.NotificationResponse
import com.gadgetseva.runner.data.model.PickupDetailResponse
import com.gadgetseva.runner.data.model.StatusTransitionRequest
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path

interface ApiService {

    // ── Auth ─────────────────────────────────────────────────────────────
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    // ── Runner inbox (JWT required) ───────────────────────────────────────
    @GET("api/mobile/runner/notifications")
    suspend fun getNotifications(): List<NotificationResponse>

    // ── Pickup portal (token-based, no JWT needed) ─────────────────────────
    @GET("api/public/pickups/{token}")
    suspend fun getPickupDetail(@Path("token") token: String): PickupDetailResponse

    @POST("api/public/pickups/{token}/accept")
    suspend fun acceptPickup(@Path("token") token: String): PickupDetailResponse

    @POST("api/public/pickups/{token}/status")
    suspend fun updatePickupStatus(
        @Path("token") token: String,
        @Body request: StatusTransitionRequest
    ): PickupDetailResponse

    @Multipart
    @POST("api/public/pickups/{token}/attachments")
    suspend fun uploadAttachment(
        @Path("token") token: String,
        @Part("attachmentType") attachmentType: RequestBody,
        @Part file: MultipartBody.Part
    ): PickupDetailResponse

    @DELETE("api/public/pickups/{token}/attachments/{attachmentId}")
    suspend fun deleteAttachment(
        @Path("token") token: String,
        @Path("attachmentId") attachmentId: Long
    ): PickupDetailResponse

    @POST("api/public/pickups/{token}/complete")
    suspend fun completePickup(@Path("token") token: String): PickupDetailResponse
}
```

### AuthInterceptor.kt

```kotlin
// network/AuthInterceptor.kt
package com.gadgetseva.runner.network

import com.gadgetseva.runner.session.SessionManager
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(private val sessionManager: SessionManager) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = sessionManager.getToken()
        val request = if (token != null) {
            chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
        } else {
            chain.request()
        }
        return chain.proceed(request)
    }
}
```

### RetrofitClient.kt

```kotlin
// network/RetrofitClient.kt
package com.gadgetseva.runner.network

import com.gadgetseva.runner.BuildConfig
import com.gadgetseva.runner.session.SessionManager
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {

    private var _sessionManager: SessionManager? = null

    fun init(sessionManager: SessionManager) {
        _sessionManager = sessionManager
    }

    private val okHttpClient: OkHttpClient by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG)
                HttpLoggingInterceptor.Level.BODY
            else
                HttpLoggingInterceptor.Level.NONE
        }
        OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(_sessionManager!!))
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build()
    }

    val apiService: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
```

---

## Data Models

```kotlin
// data/model/LoginRequest.kt
package com.gadgetseva.runner.data.model

data class LoginRequest(
    val username: String,
    val password: String
)

// data/model/LoginResponse.kt
package com.gadgetseva.runner.data.model

data class LoginResponse(
    val token: String,
    val username: String,
    val role: String
)

// data/model/NotificationResponse.kt
package com.gadgetseva.runner.data.model

data class NotificationResponse(
    val id: Long,
    val channel: String,
    val subject: String,
    val message: String,
    val deliveryStatus: String,
    val createdAt: String,
    val serviceRequestId: Long?,
    val requestNumber: String?,
    val customerName: String?,
    val deviceLabel: String?,
    val requestStatus: String?,
    val scheduledAt: String?,
    val runnerPortalToken: String?   // used to open pickup detail
)

// data/model/PickupDetailResponse.kt
package com.gadgetseva.runner.data.model

data class PickupDetailResponse(
    val id: Long,
    val requestNumber: String,
    val status: String,
    val issueSummary: String?,
    val customer: CustomerDto?,
    val device: DeviceDto?,
    val pickup: PickupDto?,
    val attachments: List<AttachmentDto>?
)

data class CustomerDto(
    val fullName: String?,
    val phone: String?,
    val email: String?,
    val address: String?
)

data class DeviceDto(
    val brand: String?,
    val model: String?,
    val serialNumber: String?,
    val imei: String?
)

data class PickupDto(
    val scheduledAt: String?,
    val runnerName: String?,
    val runnerPortalToken: String?
)

data class AttachmentDto(
    val id: Long,
    val attachmentType: String,
    val fileName: String,
    val signedUrl: String?,
    val fileSize: Long
)

// data/model/StatusTransitionRequest.kt
package com.gadgetseva.runner.data.model

data class StatusTransitionRequest(
    val status: String,
    val note: String? = null
)
```

---

## Repository

```kotlin
// data/repository/RunnerRepository.kt
package com.gadgetseva.runner.data.repository

import com.gadgetseva.runner.data.model.LoginRequest
import com.gadgetseva.runner.data.model.NotificationResponse
import com.gadgetseva.runner.data.model.PickupDetailResponse
import com.gadgetseva.runner.data.model.StatusTransitionRequest
import com.gadgetseva.runner.network.RetrofitClient
import com.gadgetseva.runner.session.SessionManager
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class RunnerRepository(private val sessionManager: SessionManager) {

    private val api get() = RetrofitClient.apiService

    // ── Auth ─────────────────────────────────────────────────────────────
    suspend fun login(username: String, password: String): Result<Unit> {
        return try {
            val response = api.login(LoginRequest(username, password))
            sessionManager.saveSession(response.token, response.username, response.role)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun logout() = sessionManager.clearSession()

    // ── Inbox ─────────────────────────────────────────────────────────────
    suspend fun getNotifications(): Result<List<NotificationResponse>> {
        return try {
            Result.success(api.getNotifications())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ── Pickup ────────────────────────────────────────────────────────────
    suspend fun getPickupDetail(token: String): Result<PickupDetailResponse> {
        return try {
            Result.success(api.getPickupDetail(token))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun acceptPickup(token: String): Result<PickupDetailResponse> {
        return try {
            Result.success(api.acceptPickup(token))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateStatus(
        token: String,
        status: String,
        note: String? = null
    ): Result<PickupDetailResponse> {
        return try {
            Result.success(api.updatePickupStatus(token, StatusTransitionRequest(status, note)))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadPhoto(
        token: String,
        photoFile: File,
        attachmentType: String = "DEVICE_PHOTO"
    ): Result<PickupDetailResponse> {
        return try {
            val requestFile = photoFile.asRequestBody("image/jpeg".toMediaType())
            val body = MultipartBody.Part.createFormData("file", photoFile.name, requestFile)
            val typeBody = attachmentType.toRequestBody("text/plain".toMediaType())
            Result.success(api.uploadAttachment(token, typeBody, body))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deletePhoto(
        token: String,
        attachmentId: Long
    ): Result<PickupDetailResponse> {
        return try {
            Result.success(api.deleteAttachment(token, attachmentId))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun completePickup(token: String): Result<PickupDetailResponse> {
        return try {
            Result.success(api.completePickup(token))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

---

## Token Storage — SessionManager.kt

```kotlin
// session/SessionManager.kt
package com.gadgetseva.runner.session

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SessionManager(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        context,
        "gsh_runner_session",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveSession(token: String, username: String, role: String) {
        prefs.edit()
            .putString("token", token)
            .putString("username", username)
            .putString("role", role)
            .apply()
    }

    fun getToken(): String? = prefs.getString("token", null)
    fun getUsername(): String? = prefs.getString("username", null)
    fun getRole(): String? = prefs.getString("role", null)
    fun isLoggedIn(): Boolean = getToken() != null

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
```

---

## ViewModels

### AuthViewModel.kt

```kotlin
// ui/auth/AuthViewModel.kt
package com.gadgetseva.runner.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gadgetseva.runner.data.repository.RunnerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthUiState(
    val loading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false
)

class AuthViewModel(private val repository: RunnerRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState = _uiState.asStateFlow()

    fun login(username: String, password: String) {
        if (username.isBlank() || password.isBlank()) {
            _uiState.value = AuthUiState(error = "Username and password are required.")
            return
        }
        viewModelScope.launch {
            _uiState.value = AuthUiState(loading = true)
            repository.login(username.trim(), password).fold(
                onSuccess = { _uiState.value = AuthUiState(success = true) },
                onFailure = { _uiState.value = AuthUiState(error = "Login failed. Check credentials.") }
            )
        }
    }
}
```

### InboxViewModel.kt

```kotlin
// ui/inbox/InboxViewModel.kt
package com.gadgetseva.runner.ui.inbox

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gadgetseva.runner.data.model.NotificationResponse
import com.gadgetseva.runner.data.repository.RunnerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class InboxUiState(
    val loading: Boolean = false,
    val notifications: List<NotificationResponse> = emptyList(),
    val error: String? = null
)

class InboxViewModel(private val repository: RunnerRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(InboxUiState())
    val uiState = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = InboxUiState(loading = true)
            repository.getNotifications().fold(
                onSuccess = { _uiState.value = InboxUiState(notifications = it) },
                onFailure = { _uiState.value = InboxUiState(error = it.message) }
            )
        }
    }

    fun logout(onDone: () -> Unit) {
        repository.logout()
        onDone()
    }
}
```

### PickupViewModel.kt

```kotlin
// ui/pickup/PickupViewModel.kt
package com.gadgetseva.runner.ui.pickup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gadgetseva.runner.data.model.PickupDetailResponse
import com.gadgetseva.runner.data.repository.RunnerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

data class PickupUiState(
    val loading: Boolean = false,
    val detail: PickupDetailResponse? = null,
    val error: String? = null,
    val actionSuccess: String? = null
)

class PickupViewModel(private val repository: RunnerRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(PickupUiState())
    val uiState = _uiState.asStateFlow()

    fun load(token: String) {
        viewModelScope.launch {
            _uiState.value = PickupUiState(loading = true)
            repository.getPickupDetail(token).fold(
                onSuccess = { _uiState.value = PickupUiState(detail = it) },
                onFailure = { _uiState.value = PickupUiState(error = it.message) }
            )
        }
    }

    fun accept(token: String) = action(token, "accept") { repository.acceptPickup(token) }

    fun markPickedUp(token: String) = action(token, "Status updated") {
        repository.updateStatus(token, "PICKUP_COMPLETED")
    }

    fun markFailed(token: String, note: String) = action(token, "Marked as failed") {
        repository.updateStatus(token, "CUSTOMER_NOT_AVAILABLE", note)
    }

    fun uploadPhoto(token: String, file: File) = action(token, "Photo uploaded") {
        repository.uploadPhoto(token, file)
    }

    fun deletePhoto(token: String, attachmentId: Long) = action(token, "Photo deleted") {
        repository.deletePhoto(token, attachmentId)
    }

    fun complete(token: String) = action(token, "Pickup completed!") {
        repository.completePickup(token)
    }

    private fun action(
        token: String,
        successMsg: String,
        block: suspend () -> Result<PickupDetailResponse>
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null, actionSuccess = null)
            block().fold(
                onSuccess = { _uiState.value = PickupUiState(detail = it, actionSuccess = successMsg) },
                onFailure = { _uiState.value = _uiState.value.copy(loading = false, error = it.message) }
            )
        }
    }
}
```

---

## UI Screens

### LoginScreen.kt

```kotlin
// ui/auth/LoginScreen.kt
package com.gadgetseva.runner.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun LoginScreen(
    viewModel: AuthViewModel,
    onLoginSuccess: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    LaunchedEffect(uiState.success) {
        if (uiState.success) onLoginSuccess()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Logo / Title
        Text(
            text = "GSH",
            fontSize = 48.sp,
            color = MaterialTheme.colorScheme.primary,
            style = MaterialTheme.typography.displayLarge
        )
        Text(
            text = "Pickup Runner",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(40.dp))

        // Username
        OutlinedTextField(
            value = username,
            onValueChange = { username = it },
            label = { Text("Username") },
            leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            isError = uiState.error != null
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Password
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            modifier = Modifier.fillMaxWidth(),
            isError = uiState.error != null
        )

        // Error message
        uiState.error?.let {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = it,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Login button
        Button(
            onClick = { viewModel.login(username, password) },
            enabled = !uiState.loading,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
        ) {
            if (uiState.loading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp
                )
            } else {
                Text("Sign In", fontSize = 16.sp)
            }
        }
    }
}
```

### InboxScreen.kt

```kotlin
// ui/inbox/InboxScreen.kt
package com.gadgetseva.runner.ui.inbox

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.gadgetseva.runner.data.model.NotificationResponse

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InboxScreen(
    viewModel: InboxViewModel,
    onOpenPickup: (token: String) -> Unit,
    onLogout: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Pickups") },
                actions = {
                    IconButton(onClick = { viewModel.load() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                    IconButton(onClick = { viewModel.logout(onLogout) }) {
                        Icon(Icons.Default.Logout, contentDescription = "Logout")
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when {
                uiState.loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }

                uiState.error != null -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = uiState.error ?: "Error loading pickups",
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(Modifier.height(12.dp))
                        Button(onClick = { viewModel.load() }) {
                            Text("Retry")
                        }
                    }
                }

                uiState.notifications.isEmpty() -> {
                    Text(
                        text = "No pickups assigned.",
                        modifier = Modifier.align(Alignment.Center),
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(uiState.notifications) { notification ->
                            PickupNotificationCard(
                                notification = notification,
                                onClick = {
                                    notification.runnerPortalToken?.let { onOpenPickup(it) }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PickupNotificationCard(
    notification: NotificationResponse,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = notification.runnerPortalToken != null, onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = notification.requestNumber ?: "—",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.primary
                )
                StatusChip(status = notification.requestStatus ?: "—")
            }

            Spacer(Modifier.height(6.dp))

            notification.customerName?.let {
                Text(
                    text = "Customer: $it",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            notification.deviceLabel?.let {
                Text(
                    text = "Device: $it",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            notification.scheduledAt?.let {
                Text(
                    text = "Scheduled: ${it.take(16).replace("T", " ")}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(Modifier.height(8.dp))

            Text(
                text = notification.message,
                style = MaterialTheme.typography.bodySmall,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (notification.runnerPortalToken == null) {
                Spacer(Modifier.height(6.dp))
                Text(
                    text = "No action available",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@Composable
private fun StatusChip(status: String) {
    val color = when {
        status.contains("APPROVED", ignoreCase = true) -> MaterialTheme.colorScheme.tertiary
        status.contains("REJECT", ignoreCase = true) -> MaterialTheme.colorScheme.error
        status.contains("COMPLETE", ignoreCase = true) -> MaterialTheme.colorScheme.primary
        else -> MaterialTheme.colorScheme.secondary
    }
    Surface(
        color = color.copy(alpha = 0.12f),
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = status.replace("_", " "),
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = color
        )
    }
}
```

### PickupDetailScreen.kt

```kotlin
// ui/pickup/PickupDetailScreen.kt
package com.gadgetseva.runner.ui.pickup

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.gadgetseva.runner.data.model.AttachmentDto
import com.gadgetseva.runner.data.model.PickupDetailResponse
import java.io.File

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
        uiState.actionSuccess?.let { snackbarHostState.showSnackbar(it) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(uiState.detail?.requestNumber ?: "Pickup Detail") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
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
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = uiState.error ?: "Failed to load pickup",
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(Modifier.height(12.dp))
                        Button(onClick = { viewModel.load(token) }) { Text("Retry") }
                    }
                }

                uiState.detail != null -> {
                    PickupDetailContent(
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

    // Fail reason dialog
    if (showFailDialog) {
        AlertDialog(
            onDismissRequest = { showFailDialog = false },
            title = { Text("Mark as Failed") },
            text = {
                Column {
                    Text("Reason for failure:")
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = failNote,
                        onValueChange = { failNote = it },
                        placeholder = { Text("e.g. Customer not available") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(onClick = {
                    viewModel.markFailed(token, failNote)
                    showFailDialog = false
                    failNote = ""
                }) { Text("Confirm") }
            },
            dismissButton = {
                TextButton(onClick = { showFailDialog = false }) { Text("Cancel") }
            }
        )
    }
}

@Composable
private fun PickupDetailContent(
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
        // Status
        item {
            StatusBanner(status = detail.status)
        }

        // Customer info
        detail.customer?.let { customer ->
            item {
                InfoCard(title = "Customer") {
                    InfoRow("Name", customer.fullName)
                    InfoRow("Phone", customer.phone)
                    InfoRow("Address", customer.address)
                }
            }
        }

        // Device info
        detail.device?.let { device ->
            item {
                InfoCard(title = "Device") {
                    InfoRow("Brand / Model", "${device.brand} ${device.model}".trim())
                    InfoRow("Serial No.", device.serialNumber)
                    InfoRow("IMEI", device.imei)
                }
            }
        }

        // Issue
        detail.issueSummary?.let {
            item {
                InfoCard(title = "Issue") {
                    Text(it, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }

        // Photos section
        item {
            InfoCard(title = "Device Photos (${detail.attachments?.size ?: 0} / 6)") {
                val photos = detail.attachments ?: emptyList()
                if (photos.isEmpty()) {
                    Text(
                        "No photos uploaded yet.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    photos.forEach { attachment ->
                        AttachmentRow(attachment = attachment, onDelete = { onDeletePhoto(attachment.id) })
                        Spacer(Modifier.height(8.dp))
                    }
                }
                if ((detail.attachments?.size ?: 0) < 6) {
                    Spacer(Modifier.height(8.dp))
                    OutlinedButton(
                        onClick = onOpenCamera,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Take Photo")
                    }
                }
            }
        }

        // Action buttons based on status
        item {
            ActionButtons(
                status = detail.status,
                loading = loading,
                onAccept = onAccept,
                onMarkPickedUp = onMarkPickedUp,
                onMarkFailed = onMarkFailed,
                onComplete = onComplete,
                photosCount = detail.attachments?.size ?: 0
            )
        }
    }
}

@Composable
private fun ActionButtons(
    status: String,
    loading: Boolean,
    onAccept: () -> Unit,
    onMarkPickedUp: () -> Unit,
    onMarkFailed: () -> Unit,
    onComplete: () -> Unit,
    photosCount: Int
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (loading) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
        }

        when (status) {
            "PICKUP_ASSIGNED" -> {
                Button(
                    onClick = onAccept,
                    enabled = !loading,
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Accept Pickup") }
            }

            "PICKUP_IN_PROGRESS" -> {
                Button(
                    onClick = onMarkPickedUp,
                    enabled = !loading && photosCount >= 1,
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Mark as Picked Up") }

                if (photosCount < 1) {
                    Text(
                        "Upload at least 1 photo to proceed.",
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
                ) { Text("Mark as Failed") }
            }

            "PICKUP_COMPLETED" -> {
                Button(
                    onClick = onComplete,
                    enabled = !loading,
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Complete Pickup") }
            }

            else -> {
                Text(
                    text = "Status: ${status.replace("_", " ")}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun AttachmentRow(attachment: AttachmentDto, onDelete: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        attachment.signedUrl?.let { url ->
            AsyncImage(
                model = url,
                contentDescription = attachment.attachmentType,
                modifier = Modifier.size(64.dp),
                contentScale = ContentScale.Crop
            )
            Spacer(Modifier.width(12.dp))
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = attachment.attachmentType.replace("_", " "),
                style = MaterialTheme.typography.bodySmall
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
                contentDescription = "Delete",
                tint = MaterialTheme.colorScheme.error
            )
        }
    }
}

@Composable
private fun StatusBanner(status: String) {
    val color = when {
        status.contains("COMPLETE") -> MaterialTheme.colorScheme.primary
        status.contains("FAIL") || status.contains("REJECT") -> MaterialTheme.colorScheme.error
        status.contains("ASSIGN") -> MaterialTheme.colorScheme.secondary
        else -> MaterialTheme.colorScheme.tertiary
    }
    Surface(
        color = color.copy(alpha = 0.12f),
        shape = MaterialTheme.shapes.medium,
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            text = status.replace("_", " "),
            modifier = Modifier.padding(12.dp),
            style = MaterialTheme.typography.titleSmall,
            color = color
        )
    }
}

@Composable
private fun InfoCard(title: String, content: @Composable ColumnScope.() -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(Modifier.height(8.dp))
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
            text = "$label: ",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.widthIn(min = 80.dp)
        )
        Text(text = value, style = MaterialTheme.typography.bodySmall)
    }
}
```

### CameraScreen.kt

```kotlin
// ui/pickup/CameraScreen.kt
package com.gadgetseva.runner.ui.pickup

import android.content.Context
import android.util.Log
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Camera
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
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

    DisposableEffect(Unit) {
        onDispose { cameraExecutor.shutdown() }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Take Photo") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Camera preview
            AndroidView(
                factory = { ctx ->
                    val previewView = PreviewView(ctx)
                    val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                    cameraProviderFuture.addListener({
                        val cameraProvider = cameraProviderFuture.get()
                        val preview = Preview.Builder().build().also {
                            it.surfaceProvider = previewView.surfaceProvider
                        }
                        val capture = ImageCapture.Builder()
                            .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                            .build()
                        imageCapture = capture
                        try {
                            cameraProvider.unbindAll()
                            cameraProvider.bindToLifecycle(
                                lifecycleOwner,
                                CameraSelector.DEFAULT_BACK_CAMERA,
                                preview,
                                capture
                            )
                        } catch (e: Exception) {
                            Log.e("Camera", "Bind failed", e)
                        }
                    }, ContextCompat.getMainExecutor(ctx))
                    previewView
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
            )

            // Capture button
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                FloatingActionButton(
                    onClick = {
                        if (!capturing) {
                            capturing = true
                            takePhoto(
                                context = context,
                                imageCapture = imageCapture,
                                executor = cameraExecutor,
                                onPhotoTaken = { file ->
                                    viewModel.uploadPhoto(token, file)
                                    capturing = false
                                    onBack()
                                },
                                onError = {
                                    capturing = false
                                }
                            )
                        }
                    },
                    modifier = Modifier.size(72.dp)
                ) {
                    if (capturing) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(32.dp),
                            strokeWidth = 3.dp
                        )
                    } else {
                        Icon(
                            Icons.Default.Camera,
                            contentDescription = "Capture",
                            modifier = Modifier.size(36.dp)
                        )
                    }
                }
            }
        }
    }
}

private fun takePhoto(
    context: Context,
    imageCapture: ImageCapture?,
    executor: ExecutorService,
    onPhotoTaken: (File) -> Unit,
    onError: () -> Unit
) {
    val capture = imageCapture ?: return
    val fileName = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(System.currentTimeMillis())
    val photoFile = File(context.cacheDir, "PICKUP_${fileName}.jpg")
    val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

    capture.takePicture(
        outputOptions,
        executor,
        object : ImageCapture.OnImageSavedCallback {
            override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                onPhotoTaken(photoFile)
            }
            override fun onError(exception: ImageCaptureException) {
                Log.e("Camera", "Capture failed", exception)
                onError()
            }
        }
    )
}
```

---

## Navigation — MainActivity.kt

```kotlin
// navigation/AppNavigation.kt
package com.gadgetseva.runner.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.gadgetseva.runner.data.repository.RunnerRepository
import com.gadgetseva.runner.ui.auth.AuthViewModel
import com.gadgetseva.runner.ui.auth.LoginScreen
import com.gadgetseva.runner.ui.inbox.InboxViewModel
import com.gadgetseva.runner.ui.inbox.InboxScreen
import com.gadgetseva.runner.ui.pickup.CameraScreen
import com.gadgetseva.runner.ui.pickup.PickupDetailScreen
import com.gadgetseva.runner.ui.pickup.PickupViewModel

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Inbox : Screen("inbox")
    object PickupDetail : Screen("pickup/{token}") {
        fun createRoute(token: String) = "pickup/$token"
    }
    object Camera : Screen("camera/{token}") {
        fun createRoute(token: String) = "camera/$token"
    }
}

@Composable
fun AppNavigation(
    navController: NavHostController,
    repository: RunnerRepository,
    startDestination: String
) {
    val authViewModel = AuthViewModel(repository)
    val inboxViewModel = InboxViewModel(repository)
    val pickupViewModel = PickupViewModel(repository)

    NavHost(navController = navController, startDestination = startDestination) {

        composable(Screen.Login.route) {
            LoginScreen(
                viewModel = authViewModel,
                onLoginSuccess = {
                    navController.navigate(Screen.Inbox.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Inbox.route) {
            InboxScreen(
                viewModel = inboxViewModel,
                onOpenPickup = { token ->
                    navController.navigate(Screen.PickupDetail.createRoute(token))
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(
            route = Screen.PickupDetail.route,
            arguments = listOf(navArgument("token") { type = NavType.StringType })
        ) { backStack ->
            val token = backStack.arguments?.getString("token") ?: return@composable
            PickupDetailScreen(
                token = token,
                viewModel = pickupViewModel,
                onBack = { navController.popBackStack() },
                onOpenCamera = { t -> navController.navigate(Screen.Camera.createRoute(t)) }
            )
        }

        composable(
            route = Screen.Camera.route,
            arguments = listOf(navArgument("token") { type = NavType.StringType })
        ) { backStack ->
            val token = backStack.arguments?.getString("token") ?: return@composable
            CameraScreen(
                token = token,
                viewModel = pickupViewModel,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
```

```kotlin
// MainActivity.kt
package com.gadgetseva.runner

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.navigation.compose.rememberNavController
import com.gadgetseva.runner.data.repository.RunnerRepository
import com.gadgetseva.runner.navigation.AppNavigation
import com.gadgetseva.runner.navigation.Screen
import com.gadgetseva.runner.network.RetrofitClient
import com.gadgetseva.runner.session.SessionManager

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val sessionManager = SessionManager(applicationContext)
        RetrofitClient.init(sessionManager)
        val repository = RunnerRepository(sessionManager)

        val startDestination = if (sessionManager.isLoggedIn())
            Screen.Inbox.route
        else
            Screen.Login.route

        setContent {
            MaterialTheme {
                val navController = rememberNavController()
                AppNavigation(
                    navController = navController,
                    repository = repository,
                    startDestination = startDestination
                )
            }
        }
    }
}
```

---

## Screen Flow Diagram

```
App Launch
    │
    ├── Token found → Inbox Screen
    │                     │
    └── No token  → Login Screen
                         │
                    ┌────┴────┐
                    │         │
              Login OK    Login Fail
                    │         │
               Inbox Screen  Show error
                    │
          ┌─────────┴─────────┐
          │                   │
    Pull-to-refresh     Tap notification
          │                   │
     Reload list        (has token?)
                               │
                        Pickup Detail Screen
                               │
              ┌────────────────┼────────────────┐
              │                │                │
        [Accept]         [Camera / Upload]  [Mark Failed]
              │                │                │
        Status →          CameraScreen     Fail Dialog
        PICKUP_IN_PROGRESS     │           → updateStatus
                          Snap photo
                               │
                        Upload via API
                               │
                        Back to Detail
                               │
                        [Mark Picked Up]  (requires ≥1 photo)
                               │
                        [Complete Pickup]
                               │
                         Status → CLOSED
```

---

## Build & Run

### Emulator (Android Studio)

```bash
# Clone the repo and open android-runner-app/ in Android Studio
# Run on AVD (API 26+)
# Backend URL is pre-set to 10.0.2.2:8081 (emulator localhost)
```

### Physical Device (same WiFi as backend)

1. Update `buildConfigField` in `build.gradle.kts`:
   ```kotlin
   buildConfigField("String", "BASE_URL", "\"http://192.168.1.XXX:8081/\"")
   ```
   Replace `192.168.1.XXX` with your machine's local IP.

2. Enable **Developer Options** → **USB Debugging** on the phone.

3. Run via Android Studio or:
   ```bash
   ./gradlew installDebug
   ```

### Production Build

```bash
# Signed APK
./gradlew assembleRelease

# Signed AAB (for Play Store)
./gradlew bundleRelease
```

---

## Environment Config

| Variable | Emulator | Physical Device | Production |
|---|---|---|---|
| `BASE_URL` | `http://10.0.2.2:8081/` | `http://192.168.x.x:8081/` | `https://api.gadgetsevahub.com/` |
| `usesCleartextTraffic` | `true` | `true` | `false` (HTTPS only) |
| `LoggingInterceptor` | BODY level | BODY level | NONE |

---

## Required Backend CORS Config

Add this to `application.yml` so the Android app can call the backend:

```yaml
# No change needed for REST calls from Android.
# CORS is only relevant for browser-based clients.
# The Android app uses direct HTTP — no CORS headers required.
```

**JWT Login** → The app posts credentials, receives a token, stores it in `EncryptedSharedPreferences`, and attaches it as `Authorization: Bearer <token>` on every subsequent request via `AuthInterceptor`.

---

## Permissions Summary

| Permission | Why |
|---|---|
| `INTERNET` | API calls to backend |
| `CAMERA` | Take 6-side device photos |
| `READ_MEDIA_IMAGES` | Access saved photos (API 33+) |
| `ACCESS_NETWORK_STATE` | Check connectivity before requests |
