// Icon name → placeholder background image (Unsplash). Shared between CategoryBar
// (top-level category tabs) and the member directory (fallback cover image for
// businesses that haven't uploaded their own).
export const CATEGORY_BG_MAP: Record<string, string> = {
  Utensils:     'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=60',
  Hotel:        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=60',
  ShoppingCart: 'https://images.unsplash.com/photo-1513884923967-4b182ef167ab?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  HeartPulse:   'https://plus.unsplash.com/premium_photo-1661775601929-8c775187bea6?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  Briefcase:    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=60',
  VscTools:     'https://plus.unsplash.com/premium_photo-1723759283157-54d22e11a870?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  Building2:    'https://images.unsplash.com/photo-1764760505443-39d3e33df39a?q=80&w=2728&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  Factory:      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=60',
  Megaphone:    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=60',
};

// Icon name → semi-transparent tint overlay class (painted over the bg image in CategoryBar).
export const CATEGORY_TINT_MAP: Record<string, string> = {
  Utensils:     'bg-orange-700/75',
  Hotel:        'bg-sky-800/75',
  ShoppingCart: 'bg-violet-700/75',
  HeartPulse:   'bg-red-800/75',
  Briefcase:    'bg-slate-700/75',
  VscTools:     'bg-yellow-700/75',
  Building2:    'bg-green-800/75',
  Factory:      'bg-stone-800/75',
  Megaphone:    'bg-teal-800/75',
};

// Same tint colors as CATEGORY_TINT_MAP, as rgba() strings for use in inline-style
// gradients (e.g. member directory cards, where the tint is mixed into a
// background-image value rather than applied as a separate Tailwind class).
export const CATEGORY_TINT_RGBA: Record<string, string> = {
  Utensils:     'rgba(194, 65, 12, 0.75)',
  Hotel:        'rgba(7, 89, 133, 0.75)',
  ShoppingCart: 'rgba(109, 40, 217, 0.75)',
  HeartPulse:   'rgba(153, 27, 27, 0.75)',
  Briefcase:    'rgba(51, 65, 85, 0.75)',
  VscTools:     'rgba(161, 98, 7, 0.75)',
  Building2:    'rgba(22, 101, 52, 0.75)',
  Factory:      'rgba(41, 37, 36, 0.75)',
  Megaphone:    'rgba(17, 94, 89, 0.75)',
};

