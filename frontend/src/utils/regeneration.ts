export const getFieldLabel = (field: string) => {
  const labels: Record<string, string> = {
    title: 'Title',
    summary: 'Summary',
    content: 'Content',
    category: 'Category',
    author: 'Author',
    tags: 'Tags',
    image: 'Image URL',
  };
  return labels[field] || field;
};


