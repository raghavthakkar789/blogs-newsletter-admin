/**
 * Shared utility for tracking edit history
 * Used by both blogs and newsletters services
 */

export interface EditHistoryEntry {
  userId: string;
  userName: string;
  editedAt: string;
  changes: string[];
}

export interface TrackChangesOptions<T> {
  oldEntity: T;
  newData: Partial<T>;
  fieldsToCheck: string[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Track changes between old entity and new data
 * Returns an edit history entry with the list of changed fields
 */
export function trackChanges<T extends Record<string, unknown>>(
  options: TrackChangesOptions<T>
): EditHistoryEntry {
  const { oldEntity, newData, fieldsToCheck, user } = options;
  const changes: string[] = [];

  fieldsToCheck.forEach(field => {
    if (field === 'tags') {
      // Special handling for tags array
      const oldTags = JSON.stringify((oldEntity[field] as string[]) || []);
      const newTags = JSON.stringify((newData[field] as string[]) || []);
      if (oldTags !== newTags) {
        changes.push(field);
      }
    } else if (newData[field] !== undefined && newData[field] !== oldEntity[field]) {
      changes.push(field);
    }
  });

  const userName = `${user.firstName} ${user.lastName}`;
  return {
    userId: user.id,
    userName,
    editedAt: new Date().toISOString(),
    changes,
  };
}

/**
 * Build update data with edit history
 */
export function buildUpdateDataWithHistory<T extends Record<string, unknown>>(
  updateDto: Partial<T>,
  existingHistory: EditHistoryEntry[] | null,
  editEntry: EditHistoryEntry,
  imageField?: string
): Partial<T> & {
  editHistory: EditHistoryEntry[];
  lastEditedAt: Date;
  lastEditedBy: string;
} {
  const updatedHistory = [...(existingHistory || []), editEntry];
  
  const updateData: Partial<T> & {
    editHistory: EditHistoryEntry[];
    lastEditedAt: Date;
    lastEditedBy: string;
  } = {
    ...updateDto,
    lastEditedBy: editEntry.userName,
    lastEditedAt: new Date(),
    editHistory: updatedHistory,
  };

  // Handle empty string image as null
  if (imageField && imageField in updateDto) {
    const imageValue = updateDto[imageField];
    if (imageValue === '') {
      (updateData as Record<string, unknown>)[imageField] = null;
    }
  }

  return updateData;
}

