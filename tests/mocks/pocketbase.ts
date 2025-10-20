import { vi } from 'vitest';

// Create a comprehensive PocketBase mock
export const createPocketBaseMock = () => {
  const mockCollection = {
    create: vi.fn(),
    getFirstListItem: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getFullList: vi.fn(),
    getOne: vi.fn(),
    getList: vi.fn(),
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
  };

  const mockPocketBase = {
    collection: vi.fn(() => mockCollection),
    authStore: {
      isValid: true,
      token: 'mock-auth-token',
      record: null,
      clear: vi.fn(),
      save: vi.fn(),
    },
    realtime: {
      isConnected: true,
    },
  };

  return { mockPocketBase, mockCollection };
};

// Default mock for PocketBase
export const pb = createPocketBaseMock().mockPocketBase;

// Helper to set up collection mock responses
export const setupCollectionMock = (collectionName: string) => {
  const { mockCollection } = createPocketBaseMock();
  (pb.collection as any).mockReturnValue(mockCollection);
  return mockCollection;
};

// Helper to mock successful record creation
export const mockCreateSuccess = (mockData: any) => {
  const collection = setupCollectionMock('games');
  collection.create.mockResolvedValue(mockData);
  return collection;
};

// Helper to mock successful record retrieval
export const mockGetSuccess = (mockData: any) => {
  const collection = setupCollectionMock('games');
  collection.getOne.mockResolvedValue(mockData);
  return collection;
};

// Helper to mock successful list retrieval
export const mockListSuccess = (mockData: any[]) => {
  const collection = setupCollectionMock('games');
  collection.getFullList.mockResolvedValue(mockData);
  collection.getList.mockResolvedValue({
    items: mockData,
    totalItems: mockData.length,
    totalPages: 1,
  });
  return collection;
};

// Helper to mock successful first item retrieval
export const mockFirstItemSuccess = (mockData: any) => {
  const collection = setupCollectionMock('games');
  collection.getFirstListItem.mockResolvedValue(mockData);
  return collection;
};

// Helper to mock record not found
export const mockNotFound = () => {
  const collection = setupCollectionMock('games');
  const error = new Error('The requested resource wasn\'t found.');
  (error as any).code = 404;
  collection.getOne.mockRejectedValue(error);
  collection.getFirstListItem.mockRejectedValue(error);
  return collection;
};

// Helper to mock API errors
export const mockApiError = (message: string, code = 400) => {
  const collection = setupCollectionMock('games');
  const error = new Error(message);
  (error as any).code = code;
  collection.create.mockRejectedValue(error);
  collection.update.mockRejectedValue(error);
  collection.delete.mockRejectedValue(error);
  return collection;
};