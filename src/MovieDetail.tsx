import {Button, Descriptions, Drawer, message, Rate, Table, Tabs, Tag} from "antd";
import DescriptionsItem from "antd/es/descriptions/Item";
import {Tag as TagEntity} from "./tag";
import EditableTagGroup from "./EditableTagGroup";
import {MovieProps, RecommendReasonType} from "./movie";
import React from "react";
import {DislikeOutlined} from '@ant-design/icons';
import {localFetch, Response} from "./api/fetch";

const {TabPane} = Tabs;

class MovieDetail extends React.Component<any, any> {
    handleDislike = async (sourceID: string|undefined, sourceType: string) => {
        if (sourceID === undefined) {
            return;
        }

        const feedbackResponse = await localFetch.PostFetch<Response>('/movie/recommend-feedback', {
            'ft': sourceType,
            'sourceID': sourceID,
        });
        if (feedbackResponse.base_resp.err_no !== undefined) {
            message.error(feedbackResponse.base_resp.err_msg);
            return;
        }
        message.success("感谢反馈~");
    }

    render() {
        const columns = [
            {
                title: '演员名字',
                dataIndex: 'name',
                key: 'key',
            },
            {
                title: '角色名字',
                dataIndex: 'character',
                key: 'key',
            }
        ]
        const movieProps: MovieProps = this.props.movie;
        let reason:RecommendReasonType|undefined = undefined;
        if (movieProps.reason) {
            reason = movieProps.reason.reason_type;
        }
        return (
            <Drawer width="88%" visible={this.props.visible} onClose={() => this.props.onClose()}>
                <Descriptions title={movieProps.title} layout="vertical" bordered>
                    <DescriptionsItem label="上映日期">
                        {movieProps.release_date}
                    </DescriptionsItem>
                    <DescriptionsItem label="语言">
                        {movieProps.language}
                    </DescriptionsItem>
                    <DescriptionsItem label="电影均分">
                        {movieProps.average_rating?.toFixed(1)}
                    </DescriptionsItem>
                    <DescriptionsItem label="简介">
                        {movieProps.introduction}
                    </DescriptionsItem>
                    <DescriptionsItem label="最多的10个标签">
                        {
                            this.props.tags.map((tag:TagEntity) => {
                                return (
                                    <Tag color="orange" key={tag.key}>
                                        {tag.content}
                                    </Tag>
                                )
                            })
                        }
                    </DescriptionsItem>
                </Descriptions>
                <Tabs defaultActiveKey="1" style={{marginTop: 16}}>
                    <TabPane tab="我的标签" key="1">
                        <EditableTagGroup movieID={movieProps.id}/>
                    </TabPane>
                    <TabPane tab="我的评分" key="2">
                        <Rate allowClear allowHalf defaultValue={0} value={this.props.userRating}
                              onChange={e => this.props.onRateChange(e, movieProps.id)}/>
                    </TabPane>
                    <TabPane tab="演员列表" key="3">
                        <Table style={{marginTop: 16}} columns={columns} dataSource={movieProps.participant}/>
                    </TabPane>
                    <TabPane tab="推荐反馈" key="4" disabled={reason === undefined}>
                            <span hidden={reason !== RecommendReasonType.RECOMMEND_REASON_TYPE_TOP_K}>
                                我们根据当前评分Top500为您推荐了这部电影
                            </span>
                        <div hidden={reason !== RecommendReasonType.RECOMMEND_REASON_TYPE_MOVIE}>
                            我们根据您为 {
                            <Button type="link" onClick={() => this.props.showSourceMovieDetail(movieProps.reason?.movie_reason.id)}>
                                {movieProps.reason?.movie_reason && movieProps.reason?.movie_reason.title}</Button>} 的评分记录推荐了这部电影
                        </div>
                        <div hidden={reason !== RecommendReasonType.RECOMMEND_REASON_TYPE_LOG}>
                            我们根据您浏览了 {
                            <Button type="link" onClick={() => this.props.showSourceMovieDetail(movieProps.reason?.movie_reason.id)}>
                                {movieProps.reason?.movie_reason && movieProps.reason?.movie_reason.title}</Button>} 推荐了这部电影
                            <div>
                                <Button type="primary" icon={<DislikeOutlined />} onClick={() => this.handleDislike(movieProps.id, "movie")}>
                                    不喜欢
                                </Button>
                            </div>
                        </div>
                        <div hidden={reason !== RecommendReasonType.RECOMMEND_REASON_TYPE_TAG}>
                            我们根据您的历史标签 ` {movieProps.reason?.tag_reason} ` 记录推荐了这部电影
                            <div>
                                <Button type="primary" icon={<DislikeOutlined />} onClick={() => this.handleDislike(movieProps.reason?.tag_reason_id, "tag")}>
                                    不喜欢
                                </Button>
                            </div>
                        </div>
                    </TabPane>
                </Tabs>
            </Drawer>
        )
    }
}

export default MovieDetail;