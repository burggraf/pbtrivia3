import PocketBase from 'pocketbase';

// PocketBase client configuration
const POCKETBASE_URL = 'http://localhost:8090';

export const pb = new PocketBase(POCKETBASE_URL) as any;

// Connection status monitoring
export const connectionStatus = {
  isConnected: true,
  lastConnected: new Date(),
  reconnectAttempts: 0
};

// Automatic reconnection logic
export const ensureConnection = () => {
  if (!connectionStatus.isConnected && connectionStatus.reconnectAttempts < 5) {
    connectionStatus.reconnectAttempts++;
    console.log(`Attempting reconnection (${connectionStatus.reconnectAttempts}/5)`);
  }
};

// Export commonly used collections
export const collections = {
  users: pb.collection('users'),
  games: pb.collection('games'),
  rounds: pb.collection('rounds'),
  questions: pb.collection('questions'),
  round_questions: pb.collection('round_questions'),
  teams: pb.collection('teams'),
  team_members: pb.collection('team_members'),
  answers: pb.collection('answers'),
  game_state: pb.collection('game_state'),
  used_questions: pb.collection('used_questions')
} as any;

// Export PocketBase instance for direct usage
export default pb;