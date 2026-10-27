import { supabase, safeExternalUrl } from './supabase.js';

const fallbackSkip = 'https://www.skipthedishes.com/wrap-n-roll-619';
const links = {
  uber_eats_url: null,
  doordash_url: null,
  skip_url: fallbackSkip
};

async function loadLinks() {
if (supabase) {
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
  if (error) console.error('Could not load ordering links:', error.message);
  else if (data) {
    links.uber_eats_url = data.uber_eats_url;
    links.doordash_url = data.doordash_url;
    links.skip_url = Object.hasOwn(data, 'skip_url') ? data.skip_url : fallbackSkip;
  }
}

for (const anchor of document.querySelectorAll('[data-provider]')) {
  const url = safeExternalUrl(links[anchor.dataset.provider]);
  anchor.hidden = !url;
  if (url) anchor.href = url;
}
}

loadLinks();
