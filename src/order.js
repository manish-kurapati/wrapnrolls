import { supabase, safeExternalUrl } from './supabase.js';

const fallbackSkip = 'https://www.skipthedishes.com/wrap-n-roll-619';
const fallbackUber = 'https://www.ubereats.com/ca/store/wrap-n-roll/zVKQ-ao_U_eTCXTUfrzBmg';
const fallbackDoorDash = 'https://www.doordash.com/en-CA/store/wrapnroll-lower-sackville-25971718/';
const links = {
  uber_eats_url: fallbackUber,
  doordash_url: fallbackDoorDash,
  skip_url: fallbackSkip
};

async function loadLinks() {
if (supabase) {
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
  if (error) console.error('Could not load ordering links:', error.message);
  else if (data) {
    links.uber_eats_url = data.uber_eats_url || fallbackUber;
    links.doordash_url = data.doordash_url || fallbackDoorDash;
    links.skip_url = data.skip_url || fallbackSkip;
  }
}

for (const anchor of document.querySelectorAll('[data-provider]')) {
  const url = safeExternalUrl(links[anchor.dataset.provider]);
  anchor.hidden = !url;
  if (url) anchor.href = url;
}
}

loadLinks();
