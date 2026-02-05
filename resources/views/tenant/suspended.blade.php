<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Suspended - {{ $tenant->name }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full text-center">
        <div class="bg-white rounded-lg shadow-lg p-8">
            <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Account Suspended</h1>
            <p class="text-gray-600 mb-6">
                The account for <strong>{{ $tenant->name }}</strong> has been suspended.
                This may be due to payment issues or a violation of our terms of service.
            </p>
            <p class="text-sm text-gray-500 mb-6">
                If you believe this is an error, please contact support.
            </p>
            <a href="mailto:support@polluxworks.com" class="inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
                Contact Support
            </a>
        </div>
        <p class="mt-6 text-sm text-gray-400">
            &copy; {{ date('Y') }} PolluxWorks. All rights reserved.
        </p>
    </div>
</body>
</html>
