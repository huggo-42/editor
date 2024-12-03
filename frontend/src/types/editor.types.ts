export interface Tab {
  id: number;
  name: string;
  active: boolean;
  content?: string;
  isDirty?: boolean;
  language?: string;
}

export interface EditorState {
  currentFile?: string;
  content?: string;
  isDirty?: boolean;
  language?: string;
  cursor?: {
    line: number;
    column: number;
  };
  selections?: Array<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }>;
}
