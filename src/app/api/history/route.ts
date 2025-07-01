import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/actions/authActions';
import { getUserHistory, getVideoHistoryPaginated } from '@/actions/historyActions';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get all user history (both image and video)
    const allHistory = await getUserHistory();
    
    // Filter video history from the complete list
    const videoHistoryItems = allHistory.filter(
      item => item.videoGenerationParams || (item.generatedVideoUrls && item.generatedVideoUrls.some(url => url))
    );
    
    return NextResponse.json({
      imageHistory: allHistory, // Return all items here so polling can find processing items
      videoHistory: videoHistoryItems,
      success: true
    });

  } catch (error) {
    console.error('Error fetching user history:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch history' 
    }, { status: 500 });
  }
}
