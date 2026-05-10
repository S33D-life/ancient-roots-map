export interface BrainNote {
  id: string;
  user_id: string;
  title: string;
  slug: string | null;
  content: string;
  tags: string[];
  is_public: boolean;
  linked_tree_ids: string[];
  created_at: string;
  updated_at: string;
}

export type BrainNoteInsert = Pick<BrainNote, "user_id" | "title" | "content"> &
  Partial<Pick<BrainNote, "slug" | "tags" | "is_public" | "linked_tree_ids">>;

export type BrainNotePatch = Partial<
  Pick<BrainNote, "title" | "content" | "tags" | "is_public" | "linked_tree_ids">
>;
