import { BoardSchema, type Board } from '../type/typesBoard';

const parseResponse = async (response: Response): Promise<unknown> => {
  const data: unknown = await response.json();
  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'error' in data
      ? String(data.error)
      : `Thinkboard request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
};

export const apiBoard = {
  async fetchCurrent(): Promise<Board> {
    const response = await fetch('/api/board', { cache: 'no-store' });
    return BoardSchema.parse(await parseResponse(response));
  },
};
