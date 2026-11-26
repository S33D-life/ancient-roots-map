// Later library connections are edition-scoped and separate from original folios.
const destinationPattern = /^(?:\/tree\/[a-f0-9-]{36}|\/species\/[a-z0-9-]+|\/library\/[a-z0-9-]+(?:\?seed=[a-z0-9-]+)?)$/;

export function councilLibraryLinks(catalog, edition, companionKey) {
  if (!Array.isArray(catalog?.links)) return [];
  return catalog.links
    .filter(item => item?.edition === edition && item.companionKey === companionKey &&
      typeof item.label === 'string' && item.label.trim())
    .map(item => ({
      label: item.label,
      href: item.status === 'verified' && typeof item.href === 'string' &&
        destinationPattern.test(item.href) ? item.href : null,
    }));
}

let catalogRequest;

export function appendCouncilLibraryLinks(container, edition, companionKey) {
  catalogRequest ??= fetch('/council/library-links.json')
    .then(response => {
      if (!response.ok) throw new Error('Library connections unavailable');
      return response.json();
    })
    .catch(() => {
      catalogRequest = undefined;
      return null;
    });
  return catalogRequest.then(catalog => {
    const links = councilLibraryLinks(catalog, edition, companionKey);
    if (!container.isConnected || !links.length) return;
    const heading = document.createElement('h4');
    heading.textContent = 'Later library connections';
    const list = document.createElement('ul');
    for (const { label, href } of links) {
      const row = document.createElement('li');
      if (href) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        row.append(link);
      } else {
        row.textContent = label + ' · planned';
      }
      list.append(row);
    }
    container.replaceChildren(heading, list);
  });
}
