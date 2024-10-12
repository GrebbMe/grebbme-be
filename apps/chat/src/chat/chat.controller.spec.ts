import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatList } from './entities/chat-list.entity';
import { ChatRoom } from './entities/chat-room.entity';

describe('ChatController', () => {
  const context = describe;
  let chatController: ChatController;
  let chatService: ChatService;
  let mockError: Error;

  const chatRoom: ChatRoom = {
    channel_id: 1,
    name: 'test',
    users: [],
    chat_lists: [],
  } as ChatRoom;

  const chatRooms: ChatRoom[] = [
    { channel_id: 1, name: 'test1', users: [], chat_lists: [] },
    { channel_id: 2, name: 'test2', users: [], chat_lists: [] },
  ] as ChatRoom[];

  const chatList: ChatList = {
    _id: new Types.ObjectId(),
    chat_list_id: 1,
    chats: [],
    created_at: new Date(),
    updated_at: new Date(),
  } as ChatList;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: {
            createChatRoom: jest.fn(),
            getChatRooms: jest.fn(),
            getChatRoom: jest.fn(),
            getChatList: jest.fn(),
          },
        },
      ],
    }).compile();

    chatController = app.get<ChatController>(ChatController);
    chatService = app.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Chat Controller, Service가 정의된다.', () => {
    expect(chatController).toBeDefined();
    expect(chatService).toBeDefined();
  });

  describe('chat controller 테스트', () => {
    context('createChatRoom을 생성하면,', () => {
      it('success : 생성된 채팅방이 return 된다.', async () => {
        jest.spyOn(chatService, 'createChatRoom').mockResolvedValue(chatRoom);

        const result = await chatController.createChatRoom({ name: chatRoom.name });

        expect(result).toEqual(chatRoom);
        expect(chatService.createChatRoom).toHaveBeenCalledWith(chatRoom.name);
      });
      it('error : name이 undefined면 BadRequestException 에러가 발생한다.', async () => {
        mockError = new Error(BadRequestException.name);
        jest.spyOn(chatService, 'createChatRoom').mockRejectedValue(mockError);

        await expect(chatController.createChatRoom({ name: undefined })).rejects.toThrow(mockError);
        expect(chatService.createChatRoom).rejects.toThrow(mockError);
      });
    });

    context('getChatRooms를 실행하면,', () => {
      const userId = 1;

      it('success: 유저에게 해당되는 채팅방 목록을 반환한다.', async () => {
        jest.spyOn(chatService, 'getChatRooms').mockResolvedValue(chatRooms);

        const result = await chatController.getChatRooms({ id: userId });

        expect(result).toEqual(chatRooms);
        expect(chatService.getChatRooms).toHaveBeenCalledWith(userId);
      });

      it('error: 채팅방이 없을 경우 NotFoundException을 반환한다.', async () => {
        jest.spyOn(chatService, 'getChatRooms').mockRejectedValue(new NotFoundException());

        await expect(chatController.getChatRooms({ id: userId })).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    context('getChatRoom을 실행하면,', () => {
      const channelId = 1;

      it('success: 해당 채널의 채팅방을 반환한다.', async () => {
        jest.spyOn(chatService, 'getChatRoom').mockResolvedValue(chatRoom);

        const result = await chatController.getChatRoom({ id: channelId });

        expect(result).toEqual(chatRoom);
        expect(chatService.getChatRoom).toHaveBeenCalledWith(channelId);
      });

      it('error: 채팅방이 없을 경우 NotFoundException을 반환한다.', async () => {
        jest.spyOn(chatService, 'getChatRoom').mockRejectedValue(new NotFoundException());

        await expect(chatController.getChatRoom({ id: channelId })).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    context('getChatList를 실행하면,', () => {
      const channelId = 1;
      const page = 1;

      it('success: 해당 채널의 채팅 리스트를 반환한다.', async () => {
        jest.spyOn(chatService, 'getChatList').mockResolvedValue(chatList);

        const result = await chatController.getChatList({ id: channelId, page: page });

        expect(result).toEqual(chatList);
        expect(chatService.getChatList).toHaveBeenCalledWith(channelId, page);
      });

      it('error: 채팅 리스트가 없을 경우 NotFoundException을 반환한다.', async () => {
        jest.spyOn(chatService, 'getChatList').mockRejectedValue(new NotFoundException());

        await expect(chatController.getChatList({ id: channelId, page: page })).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });
});
