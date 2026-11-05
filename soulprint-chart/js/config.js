/* Your links. Edit the text between the quote marks, save, and the page updates. */
window.Soulprint = window.Soulprint || {};
window.Soulprint.config = {
  // Your main website. "../" means the main site that sits one folder above this page.
  // If you ever move this page to its own website, put the full address here, e.g. "https://yourname.github.io/astro-soulprint/"
  websiteUrl: '../',

  // Buttons in the "A reading shows you how to live it" card. Each link opens a page of your main site.
  packageLinks: [
    { label: 'See Human Design readings', href: '../human-design/', primary: true },
    { label: 'Human Design Full Chart reading', href: '../soulprint-core/' }
  ],

  // The "Your 4 Arrows" card. Change the label/link to your 4 Arrows package.
  arrowsLink: { label: 'Get my HD 4 Arrows reading', href: '../human-design/' },

  // true = show the colour names (Appetite, Caves, Fear...) in the 4 Arrows card.
  // false = show only the arrow directions and invite people to book the 4 Arrows reading.
  showVariableDetails: true,

  messengerUrl: 'https://m.me/astrosoulprintbyalex',
  facebookUrl: 'https://www.facebook.com/profile.php?id=61561494154512'
};
