<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setting Up - {{ $tenant->name }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <meta http-equiv="refresh" content="5">
</head>
<body class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full text-center">
        <div class="bg-white rounded-lg shadow-lg p-8">
            <div class="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg class="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Setting Up Your Workspace</h1>
            <p class="text-gray-600 mb-6">
                We're preparing <strong>{{ $tenant->name }}</strong> for you. This usually takes just a few moments.
            </p>

            <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div class="bg-blue-600 h-2 rounded-full animate-pulse" style="width: 75%"></div>
            </div>

            <p class="text-sm text-gray-500">
                This page will automatically refresh when your workspace is ready.
            </p>
        </div>
        <p class="mt-6 text-sm text-gray-400">
            &copy; {{ date('Y') }} PolluxWorks. All rights reserved.
        </p>
    </div>
</body>
</html>
