import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CHAT } from '@shared/constants/chat-constants';
import { Model } from 'mongoose';
import { ChatList } from './entity/chat-list.entity';
import { ChatRoom } from './entity/chat-room.entity';

@Injectable()
export class ChatService {
  public constructor(
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoom>,
    @InjectModel(ChatList.name) private chatListModel: Model<ChatList>,
  ) {}

  public async createChatRoom(chatRoomName: string) {
    const lastChatRoom = await this.chatRoomModel
      .findOne()
      .sort({ channel_id: CHAT.CHAT_ROOM_SORT_DESC })
      .exec();

    const newChatRoomId = lastChatRoom ? lastChatRoom.channel_id + 1 : 1;

    const newChatRoom = new this.chatRoomModel({
      channel_id: newChatRoomId,
      name: chatRoomName,
      users: [],
      chat_lists: [],
    });

    const createdChatRoom = await newChatRoom.save();
    return createdChatRoom;
  }

  public async getChatRoomsById(id: number): Promise<ChatRoom[]> {
    return await this.chatRoomModel.find({ users: id }).exec();
  }

  public async getChatList(channelId: number, page: number): Promise<ChatList> {
    const chatRoom = await this.chatRoomModel.findOne({ channel_id: channelId }).exec();

    if (!chatRoom) throw new NotFoundException('해당 채널에 대한 채팅방이 없습니다.');

    const [chatList] = await this.chatListModel
      .find({ _id: { $in: chatRoom.chat_lists } })
      .sort({ created_at: CHAT.CHAT_LIST_SORT_DESC })
      .skip(page)
      .limit(CHAT.CHAT_LIST_PAGINATION_LIMIT)
      .exec();

    if (!chatList) throw new NotFoundException('해당 채널에 대한 채팅 리스트가 없습니다.');

    return chatList;
  }
}
