import { AboutPortrait, AboutBio } from './About'
import GalleryPage, { gallerySpreadCount } from './Gallery'
import { MerchShelf, MerchFeatured } from './Merch'

// Every page of the sketchbook, in reading order. Pages come in pairs (left, right),
// so each section must have an even number of pages to start on a fresh spread.
export const pages = [
  { id: 'about-1', section: 'about', render: () => <AboutPortrait /> },
  { id: 'about-2', section: 'about', render: () => <AboutBio /> },
  ...Array.from({ length: gallerySpreadCount }, (_, spread) => [
    { id: `gallery-${spread}-l`, section: 'gallery', render: () => <GalleryPage spread={spread} side="left" /> },
    { id: `gallery-${spread}-r`, section: 'gallery', render: () => <GalleryPage spread={spread} side="right" /> },
  ]).flat(),
  { id: 'merch-1', section: 'merch', render: () => <MerchShelf /> },
  { id: 'merch-2', section: 'merch', render: () => <MerchFeatured /> },
]
