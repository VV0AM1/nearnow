import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  create(createUserInput: CreateUserInput) {
    return this.prisma.user.create({
      data: createUserInput,
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true, votes: true, comments: true }
        }
      }
    });

    if (!user) return null;

    // Gamification Logic (Ported from Web)
    const points = user.reputation || 0;
    const POINTS_PER_LEVEL = 5;
    const level = Math.floor(points / POINTS_PER_LEVEL) + 1;

    let rank = 'Novice';
    if (level >= 50) rank = 'Platinum';
    else if (level >= 30) rank = 'Gold';
    else if (level >= 15) rank = 'Silver';
    else if (level >= 5) rank = 'Bronze';

    const nextLevelPoints = level * POINTS_PER_LEVEL;
    const currentLevelStartPoints = (level - 1) * POINTS_PER_LEVEL;
    const pointsInCurrentLevel = points - currentLevelStartPoints;
    const progress = (pointsInCurrentLevel / POINTS_PER_LEVEL) * 100;

    return {
      ...user,
      gamification: {
        level,
        rank,
        points,
        nextLevelPoints,
        progress
      }
    };
  }

  update(id: string, updateUserInput: UpdateUserInput) {
    const { id: _, ...data } = updateUserInput;
    return this.prisma.user.update({
      where: { id },
      data: data,
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getSavedPosts(userId: string) {
    return this.prisma.savedPost.findMany({
      where: { userId },
      include: { post: true }, // Include full post details
      orderBy: { createdAt: 'desc' }
    });
  }

  async toggleSavedPost(userId: string, postId: string) {
    const existing = await this.prisma.savedPost.findUnique({
      where: {
        userId_postId: { userId, postId }
      }
    });

    if (existing) {
      await this.prisma.savedPost.delete({
        where: { id: existing.id }
      });
      return { saved: false };
    } else {
      await this.prisma.savedPost.create({
        data: { userId, postId }
      });
      return { saved: true };
    }
  }

  async isPostSaved(userId: string, postId: string) {
    const count = await this.prisma.savedPost.count({
      where: { userId, postId }
    });
    return count > 0;
  }
}
