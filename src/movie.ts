interface ParticipantProps {
    key: string
    character: string
    name: string
}
enum RecommendReasonType {
    RECOMMEND_REASON_TYPE_TAG = 1,
    RECOMMEND_REASON_TYPE_MOVIE = 2,
    RECOMMEND_REASON_TYPE_LOG = 3,
    RECOMMEND_REASON_TYPE_TOP_K = 4
}
const recommendReasonType2Tip = new Map<RecommendReasonType, string>();
recommendReasonType2Tip.set(RecommendReasonType.RECOMMEND_REASON_TYPE_TAG, "历史标签");
recommendReasonType2Tip.set(RecommendReasonType.RECOMMEND_REASON_TYPE_MOVIE, "评分记录");
recommendReasonType2Tip.set(RecommendReasonType.RECOMMEND_REASON_TYPE_LOG, "浏览记录");
recommendReasonType2Tip.set(RecommendReasonType.RECOMMEND_REASON_TYPE_TOP_K, "最高评分");

interface RecommendReasonProps {
    movie_reason: MovieProps
    tag_reason: string
    tag_reason_id: string
    reason_type: RecommendReasonType
}

interface MovieProps {
    id: string
    title: string
    pic_url: string
    introduction?: string
    participant?: Array<ParticipantProps>
    release_date?: number
    language?: string
    reason?: RecommendReasonProps
    average_rating?: number
}

export {RecommendReasonType, recommendReasonType2Tip}
export type {MovieProps, ParticipantProps, RecommendReasonProps}