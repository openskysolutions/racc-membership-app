export async function getMembersList(): Promise<string[]> {
  const response = await fetch(
    'https://5fab1z0ahuvledqozjvx.app.clientclub.net/communities/groups/richfield-area-chamber/member-list',
    {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
      },
      credentials: 'include',
    }
  );
  const htmlText = await response.text();
  // Parse HTML to extract list items
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const items = Array.from(doc.querySelectorAll('li')).map(li => li.textContent?.trim() || '');
  return items;
}