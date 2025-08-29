<script lang="ts">
  import { MetaTags } from 'svelte-meta-tags';
</script>

<MetaTags
  title="Site Analytics - PyPI Stats"
  description="Public analytics for PyPIStats.dev powered by Plausible Analytics."
  keywords={["PyPIStats", "analytics", "Plausible", "traffic stats"]}
/>

<svelte:head>
  <script async src="https://events.plygrnd.org/js/embed.host.js"></script>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <div class="mb-8 text-center">
    <h1 class="text-3xl font-bold text-gray-100">Site Analytics</h1>
    <p class="text-gray-400 mt-2">Public dashboard powered by Plausible</p>
  </div>

  <div class="rounded-lg border border-gray-800 bg-gray-900 p-4">
    <iframe title="Plausible Analytics for pypistats.dev" data-plausible-embed src="https://events.plygrnd.org/share/pypistats.dev?auth=cT6JcGh_NFK5biIvXyKi1&embed=true&theme=system&background=transparent" scrolling="no" frameborder="0" loading="lazy" style="width: 1px; min-width: 100%; height: 1600px;"></iframe>
    <div class="text-sm text-gray-400 pt-3 pb-1">Stats powered by <a target="_blank" class="text-indigo-400 underline" href="https://plausible.io">Plausible Analytics</a></div>
  </div>
</div>


