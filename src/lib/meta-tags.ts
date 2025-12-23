/**
 * Utility functions for managing Open Graph and social media meta tags
 */

export interface MetaTagsData {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  price?: number;
  location?: string;
  date?: string;
}

/**
 * Updates Open Graph meta tags dynamically
 */
export function updateMetaTags(data: MetaTagsData) {
  // Update or create meta tags
  const setMetaTag = (property: string, content: string) => {
    let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute('property', property);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  const setMetaName = (name: string, content: string) => {
    let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute('name', name);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Update title
  if (document.title !== data.title) {
    document.title = data.title;
  }

  // Update description
  setMetaName('description', data.description);

  // Open Graph tags
  setMetaTag('og:title', data.title);
  setMetaTag('og:description', data.description);
  setMetaTag('og:image', data.image);
  setMetaTag('og:url', data.url);
  setMetaTag('og:type', data.type || 'website');

  // Twitter Card tags
  setMetaName('twitter:card', 'summary_large_image');
  setMetaName('twitter:title', data.title);
  setMetaName('twitter:description', data.description);
  setMetaName('twitter:image', data.image);

  // Additional Open Graph tags if available
  if (data.location) {
    setMetaTag('og:locale', 'en_US');
  }
}

/**
 * Resets meta tags to default values
 */
export function resetMetaTags() {
  const defaultTitle = 'Quilting Retreats - Discover, Learn, and Connect';
  const defaultDescription = 'Discover amazing quilting retreats. Learn modern techniques, create art quilts, and connect with expert instructors in beautiful locations.';
  const defaultImage = `${window.location.origin}/favicon1.png`;
  const defaultUrl = window.location.origin;

  updateMetaTags({
    title: defaultTitle,
    description: defaultDescription,
    image: defaultImage,
    url: defaultUrl,
  });
}

