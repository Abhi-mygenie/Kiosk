package com.kioskapp

import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript.
   */
  override fun getMainComponentName(): String = "KioskApp"

  /**
   * Returns the instance of the [ReactActivityDelegate].
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
    
    // Enable immersive fullscreen mode for kiosk
    enableImmersiveMode()
    
    // Keep screen on
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  }

  override fun onResume() {
    super.onResume()
    enableImmersiveMode()
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) {
      enableImmersiveMode()
    }
  }

  private fun enableImmersiveMode() {
    window.decorView.systemUiVisibility = (
      View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
      or View.SYSTEM_UI_FLAG_FULLSCREEN
      or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
      or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
      or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
      or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
    )
  }

  // Block back button for kiosk mode
  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    return when (keyCode) {
      KeyEvent.KEYCODE_BACK,
      KeyEvent.KEYCODE_HOME,
      KeyEvent.KEYCODE_APP_SWITCH -> true
      else -> super.onKeyDown(keyCode, event)
    }
  }

  override fun onBackPressed() {
    // Disable back button in kiosk mode
  }
}
