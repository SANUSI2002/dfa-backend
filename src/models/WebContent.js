import mongoose from 'mongoose';

/**
 * WebContent schema
 * Stores all editable website content sections
 */
const webContentSchema = new mongoose.Schema(
  {
    // Only one document — use a fixed key
    key: {
      type: String,
      default: 'main',
      unique: true,
    },

    hero: {
      headline:        { type: String, default: 'Faith, Culture, Real Conversations' },
      subHeadline:     { type: String, default: 'Est. Muslims, Young Professionals' },
      description:     { type: String, default: 'DFA is a media and community platform for young Muslims navigating life and faith.' },
      primaryLabel:    { type: String, default: 'Explore Our Videos' },
      primaryUrl:      { type: String, default: '/videos' },
      secondaryLabel:  { type: String, default: 'Get Event Tickets' },
      secondaryUrl:    { type: String, default: '/tickets' },
      imageUrl:        { type: String, default: '' },
      visible:         { type: Boolean, default: true },
    },

    about: {
      headline:    { type: String, default: 'About DFA' },
      subHeading:  { type: String, default: 'Our Identity' },
      tagLine:     { type: String, default: 'Faith-driven, Creators, Community Inc.' },
      mainText:    { type: String, default: 'DFA is a faith-driven media and community platform for young Muslims.' },
      mission:     { type: String, default: 'We produce video interviews, teachings, and reflections that start real conversations.' },
      statViews:   { type: String, default: '1000' },
      statContent: { type: String, default: '200 Views' },
      statCommunity: { type: String, default: '2,015' },
    },

    whatWeDo: {
      heading:    { type: String, default: 'What We Do' },
      subHeading: { type: String, default: 'Three pillars of everything we create' },
      pillar1Title: { type: String, default: 'Media & Content' },
      pillar1Icon:  { type: String, default: 'fa-play' },
      pillar1Desc:  { type: String, default: 'We produce video interviews, teachings, and reflections that start real conversations.' },
      pillar2Title: { type: String, default: 'Events' },
      pillar2Icon:  { type: String, default: 'fa-calendar-days' },
      pillar2Desc:  { type: String, default: 'We host gatherings, conferences, and experiences designed to connect and inspire young Muslims.' },
      pillar3Title: { type: String, default: 'Community' },
      pillar3Icon:  { type: String, default: 'fa-users' },
      pillar3Desc:  { type: String, default: 'We build spaces — online and offline — where faith, culture, and real life intersect.' },
    },

    content: {
      videoHeading:    { type: String, default: 'Latest Videos' },
      videoSubHeading: { type: String, default: 'Fresh conversations and teachings' },
      showVideos:      { type: Boolean, default: true },
      eventsHeading:   { type: String, default: 'Upcoming Events' },
      maxEvents:       { type: String, default: '4' },
      showEvents:      { type: Boolean, default: true },
    },

    footer: {
      brandName:    { type: String, default: 'DFATV' },
      tagline:      { type: String, default: 'Faith. Culture. Real Conversations.' },
      description:  { type: String, default: 'A media and community platform for young Muslims navigating faith, culture, and life.' },
      copyright:    { type: String, default: '© 2026 DFATV. All rights reserved.' },
      instagram:    { type: String, default: '' },
      youtube:      { type: String, default: '' },
      twitter:      { type: String, default: '' },
      tiktok:       { type: String, default: '' },
      whatsapp:     { type: String, default: '' },
      facebook:     { type: String, default: '' },
      col1Heading:  { type: String, default: 'Explore' },
      col2Heading:  { type: String, default: 'Community' },
      col1Links:    { type: String, default: 'Videos|/videos\nEvents|/events\nGallery|/gallery\nBlog|/blog' },
      col2Links:    { type: String, default: 'About Us|/about\nWhatsApp|/community\nContact|/contact\nTickets|/tickets' },
    },
  },
  { timestamps: true }
);

const WebContent = mongoose.model('WebContent', webContentSchema);
export default WebContent;
