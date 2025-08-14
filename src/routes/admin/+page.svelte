<script lang="ts">
  import { onMount } from 'svelte';

  let processing = $state(false);
  let cacheClearing = $state(false);
  let results: any = $state(null);
  let error: string | null = $state(null);
  let cacheInfo: any = $state(null);
  let cronStatus: any = $state(null);
  let date = $state('');
  let purge = $state(true);
  let packageName = $state('');
  let searchQuery = $state('');

  // Get yesterday's date as default
  onMount(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString().split('T')[0];
  });

  async function processData() {
    processing = true;
    error = null;
    results = null;

    try {
      const response = await fetch('/api/admin/process-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, purge })
      });

      const data = await response.json();
      
      if (data.success) {
        results = data.results;
      } else {
        error = data.message || 'Data processing failed';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Network error';
    } finally {
      processing = false;
    }
  }

  async function getCacheInfo() {
    try {
      const response = await fetch('/api/admin/cache');
      cacheInfo = await response.json();
    } catch (err) {
      console.error('Failed to get cache info:', err);
    }
  }

  async function clearAllCache() {
    cacheClearing = true;
    error = null;

    try {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'clear' })
      });

      const data = await response.json();
      
      if (data.success) {
        await getCacheInfo();
      } else {
        error = data.message || 'Failed to clear cache';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Network error';
    } finally {
      cacheClearing = false;
    }
  }

  async function invalidatePackageCache() {
    if (!packageName.trim()) {
      error = 'Package name is required';
      return;
    }

    try {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'invalidate-package', 
          packageName: packageName.trim() 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await getCacheInfo();
      } else {
        error = data.message || 'Failed to invalidate package cache';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Network error';
    }
  }

  async function invalidateSearchCache() {
    try {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'invalidate-search' })
      });

      const data = await response.json();
      
      if (data.success) {
        await getCacheInfo();
      } else {
        error = data.message || 'Failed to invalidate search cache';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Network error';
    }
  }

  async function getCronStatus() { cronStatus = null; }

  async function runCronNow() {}

  // Load cache info and cron status on mount
  onMount(() => {
    getCacheInfo();
    getCronStatus();
  });
</script>

<svelte:head>
  <title>Admin Dashboard - PyPI Stats</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Not Found</h1>
      <p class="mt-2 text-gray-600">The admin dashboard has been removed.</p>
      <p class="mt-4"><a href="/" class="text-blue-600 hover:text-blue-800">Return to homepage</a></p>
    </div>

    {#if error}
      <div class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error</h3>
            <div class="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Data Processing Section -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Data Processing</h2>
        
        <div class="space-y-4">
          <div>
            <label for="date" class="block text-sm font-medium text-gray-700">Processing Date</label>
            <input
              type="date"
              id="date"
              bind:value={date}
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              id="purge"
              bind:checked={purge}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="purge" class="ml-2 block text-sm text-gray-900">
              Purge old data (keep only 180 days)
            </label>
          </div>

          <div class="grid grid-cols-1 gap-3">
            <button
              onclick={processData}
              disabled={processing}
              class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Process Data'}
            </button>

            <button
              onclick={runCronNow}
              disabled={processing}
              class="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Run Cron Now'}
            </button>
          </div>
        </div>

        {#if results}
          <div class="mt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-3">Results</h3>
            <div class="bg-gray-50 rounded-md p-4">
              <pre class="text-sm text-gray-700 overflow-auto">{JSON.stringify(results, null, 2)}</pre>
            </div>
          </div>
        {/if}
      </div>

      <!-- Cron removed -->

      <!-- Cache Management Section -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Cache Management</h2>
        
        <div class="space-y-4">
          <div>
            <label for="packageName" class="block text-sm font-medium text-gray-700">Package Name</label>
            <input
              type="text"
              id="packageName"
              bind:value={packageName}
              placeholder="e.g., numpy"
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div class="grid grid-cols-1 gap-3">
            <button
              onclick={invalidatePackageCache}
              disabled={!packageName.trim()}
              class="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Invalidate Package Cache
            </button>

            <button
              onclick={invalidateSearchCache}
              class="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
            >
              Invalidate Search Cache
            </button>

            <button
              onclick={clearAllCache}
              disabled={cacheClearing}
              class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cacheClearing ? 'Clearing...' : 'Clear All Cache'}
            </button>
          </div>
        </div>

        {#if cacheInfo}
          <div class="mt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-3">Cache Information</h3>
            <div class="bg-gray-50 rounded-md p-4">
              <pre class="text-sm text-gray-700 overflow-auto">{JSON.stringify(cacheInfo, null, 2)}</pre>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Environment Information -->
    <div class="mt-8 bg-white shadow rounded-lg p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Environment Information</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 class="text-sm font-medium text-gray-700">Database</h3>
          <p class="text-sm text-gray-900">
            {typeof process !== 'undefined' && process.env.DATABASE_URL ? 'Configured' : 'Not configured'}
          </p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-700">Google Cloud</h3>
          <p class="text-sm text-gray-900">
            {typeof process !== 'undefined' && process.env.GOOGLE_PROJECT_ID ? 'Configured' : 'Not configured'}
          </p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-700">Redis</h3>
          <p class="text-sm text-gray-900">
            {typeof process !== 'undefined' && process.env.REDIS_URL ? 'Configured' : 'Not configured'}
          </p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-700">Environment</h3>
          <p class="text-sm text-gray-900">
            {typeof process !== 'undefined' ? process.env.NODE_ENV || 'development' : 'development'}
          </p>
        </div>
      </div>
    </div>
  </div>
</div> 