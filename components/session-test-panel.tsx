"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  TestTube,
  CheckCircle,
  XCircle,
  RefreshCw,
  LogIn,
  LogOut,
  Clock,
  Trash2,
} from "lucide-react";
import { SessionTestUtils } from "@/lib/utils/session-test";
import { useClientSession } from "@/lib/hooks/use-client-session";

interface SessionTestPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SessionTestPanel({
  isOpen,
  onClose,
}: SessionTestPanelProps) {
  const { session, isAuthenticated } = useClientSession();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string, isSuccess: boolean = true) => {
    const timestamp = new Date().toLocaleTimeString();
    const icon = isSuccess ? "✅" : "❌";
    setTestResults((prev) => [...prev, `[${timestamp}] ${icon} ${message}`]);
  };

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    try {
      addResult(`Starting ${testName}...`);
      await testFn();
      addResult(`${testName} completed successfully`);
    } catch (error) {
      addResult(`${testName} failed: ${error}`, false);
    }
  };

  const handleLoginTest = () =>
    runTest("Cross-tab Login", SessionTestUtils.testCrossTabLogin);
  const handleLogoutTest = () =>
    runTest("Cross-tab Logout", SessionTestUtils.testCrossTabLogout);
  const handleExpiryTest = () =>
    runTest("Session Expiry", SessionTestUtils.testSessionExpiry);
  const handleRefreshTest = () =>
    runTest("Session Refresh", SessionTestUtils.testSessionRefresh);
  const handleFullTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    addResult("Starting full test suite...");

    try {
      await SessionTestUtils.runFullTest();
      addResult("Full test suite completed successfully");
    } catch (error) {
      addResult(`Full test suite failed: ${error}`, false);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCleanup = () => {
    SessionTestUtils.cleanup();
    addResult("Test data cleaned up");
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Session Test Panel
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Session Status */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant={isAuthenticated ? "default" : "secondary"}>
                {isAuthenticated ? "Logged In" : "Not Logged In"}
              </Badge>
              {session && (
                <span className="text-sm text-gray-600">
                  {session.name} ({session.username})
                </span>
              )}
            </div>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button
              onClick={handleLoginTest}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Login Test
            </Button>

            <Button
              onClick={handleLogoutTest}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout Test
            </Button>

            <Button
              onClick={handleExpiryTest}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Expiry Test
            </Button>

            <Button
              onClick={handleRefreshTest}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Test
            </Button>

            <Button
              onClick={handleFullTest}
              variant="default"
              size="sm"
              className="flex items-center gap-2"
              disabled={isRunning}
            >
              <TestTube className="w-4 h-4" />
              {isRunning ? "Running..." : "Full Test"}
            </Button>

            <Button
              onClick={handleCleanup}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Cleanup
            </Button>
          </div>

          {/* Test Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Test Results</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={clearResults}
                disabled={testResults.length === 0}
              >
                Clear
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto bg-gray-50 rounded-lg p-4">
              {testResults.length === 0 ? (
                <p className="text-gray-500 text-sm">No tests run yet</p>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertDescription>
              <strong>Instructions:</strong>
              <br />
              1. Open multiple tabs of this application
              <br />
              2. Run the "Login Test" in one tab
              <br />
              3. Check if the session appears in other tabs
              <br />
              4. Run the "Logout Test" and verify it affects all tabs
              <br />
              5. Use "Full Test" to run all tests automatically
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}


