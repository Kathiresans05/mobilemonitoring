package com.monitoring.app

import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build

class UsageMonitor(private val context: Context) {

    fun getCurrentApp(): String {
        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val endTime = System.currentTimeMillis()
        val startTime = endTime - 1000 * 10 // Look at last 10 seconds

        val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)
        if (stats != null) {
            var lastApp: String? = null
            var lastTime = 0L
            for (usageStats in stats) {
                if (usageStats.lastTimeUsed > lastTime) {
                    lastTime = usageStats.lastTimeUsed
                    lastApp = usageStats.packageName
                }
            }
            return lastApp?.split(".")?.last() ?: "Unknown"
        }
        return "None"
    }
}
