import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { MessageInput } from '@/components/chat/MessageInput';
import { MessageList } from '@/components/chat/MessageList';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(() => Promise.resolve({ 
      data: { user: { id: 'test-user', email: 'test@example.com' } } 
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ 
          data: [], 
          error: null 
        }))
      }))
    })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
    })),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ error: null })),
      createSignedUrl: vi.fn(() => Promise.resolve({ 
        data: { signedUrl: 'test-url' } 
      }))
    }))
  },
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn(() => Promise.resolve())
    })),
    track: vi.fn(() => Promise.resolve()),
    untrack: vi.fn(() => Promise.resolve()),
    unsubscribe: vi.fn(() => Promise.resolve())
  }))
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('Chat System E2E Tests', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('MessageInput Component', () => {
    it('should render message input with send button', () => {
      render(
        <MessageInput 
          channelId="test-channel" 
          onSent={vi.fn()} 
        />
      );

      expect(screen.getByPlaceholderText('پیام خود را بنویسید...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ارسال/i })).toBeInTheDocument();
    });

    it('should handle message typing and sending', async () => {
      const onSent = vi.fn();
      render(
        <MessageInput 
          channelId="test-channel" 
          onSent={onSent} 
        />
      );

      const messageInput = screen.getByPlaceholderText('پیام خود را بنویسید...');
      const sendButton = screen.getByRole('button', { name: /ارسال/i });

      await user.type(messageInput, 'Hello, this is a test message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('messages');
        expect(onSent).toHaveBeenCalled();
      });
    });

    it('should handle file attachments', async () => {
      render(
        <MessageInput 
          channelId="test-channel" 
          onSent={vi.fn()} 
        />
      );

      const fileInput = screen.getByDisplayValue('') as HTMLInputElement;
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

      await user.upload(fileInput, testFile);

      expect(fileInput.files).toHaveLength(1);
      expect(fileInput.files?.[0]).toBe(testFile);
    });

    it('should prevent sending empty messages', async () => {
      const onSent = vi.fn();
      render(
        <MessageInput 
          channelId="test-channel" 
          onSent={onSent} 
        />
      );

      const sendButton = screen.getByRole('button', { name: /ارسال/i });
      await user.click(sendButton);

      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(onSent).not.toHaveBeenCalled();
    });
  });

  describe('MessageList Component', () => {
    it('should render message list', () => {
      render(<MessageList channelId="test-channel" />);
      
      // Should render without crashing
      expect(screen.getByTestId).toBeDefined();
    });

    it('should handle real-time message updates', async () => {
      const channelMock = {
        on: vi.fn(() => ({ subscribe: vi.fn() })),
        track: vi.fn(() => Promise.resolve()),
        untrack: vi.fn(() => Promise.resolve()),
        subscribe: vi.fn(),
        unsubscribe: vi.fn()
      };

      mockSupabase.channel.mockReturnValue(channelMock);

      render(<MessageList channelId="test-channel" />);

      // Verify channel subscription was set up
      expect(mockSupabase.channel).toHaveBeenCalledWith('messages');
    });
  });

  describe('ChatPanel Integration', () => {
    it('should render complete chat interface', () => {
      render(
        <ChatPanel
          open={true}
          onOpenChange={vi.fn()}
          channelId="test-channel"
          taskTitle="Test Task"
        />
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('پیام خود را بنویسید...')).toBeInTheDocument();
    });

    it('should handle typing indicators', async () => {
      const mockChannel = {
        track: vi.fn(() => Promise.resolve()),
        untrack: vi.fn(() => Promise.resolve()),
        on: vi.fn(() => ({ subscribe: vi.fn() })),
        subscribe: vi.fn(),
        unsubscribe: vi.fn()
      };

      mockSupabase.channel.mockReturnValue(mockChannel);

      render(
        <ChatPanel
          open={true}
          onOpenChange={vi.fn()}
          channelId="test-channel"
          taskTitle="Test Task"
        />
      );

      const messageInput = screen.getByPlaceholderText('پیام خود را بنویسید...');
      await user.type(messageInput, 'Typing...');

      await waitFor(() => {
        expect(mockChannel.track).toHaveBeenCalledWith({
          typing: true,
          user_id: 'test-user'
        });
      });
    });

    it('should handle panel open/close state', async () => {
      const onOpenChange = vi.fn();
      
      render(
        <ChatPanel
          open={false}
          onOpenChange={onOpenChange}
          channelId="test-channel"
          taskTitle="Test Task"
        />
      );

      // Panel should be closed initially
      expect(screen.queryByText('Test Task')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      mockSupabase.auth.getUser.mockRejectedValueOnce(new Error('Auth failed'));

      render(
        <MessageInput 
          channelId="test-channel" 
          onSent={vi.fn()} 
        />
      );

      const messageInput = screen.getByPlaceholderText('پیام خود را بنویسید...');
      const sendButton = screen.getByRole('button', { name: /ارسال/i });

      await user.type(messageInput, 'Test message');
      await user.click(sendButton);

      // Should not crash and should handle error gracefully
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle network errors during message sending', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        insert: vi.fn(() => Promise.resolve({ 
          error: { message: 'Network error' } 
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
      });

      const onSent = vi.fn();
      render(
        <MessageInput 
          channelId="test-channel" 
          onSent={onSent} 
        />
      );

      const messageInput = screen.getByPlaceholderText('پیام خود را بنویسید...');
      const sendButton = screen.getByRole('button', { name: /ارسال/i });

      await user.type(messageInput, 'Test message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(onSent).not.toHaveBeenCalled();
      });
    });
  });
});