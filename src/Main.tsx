import React from "react";
import {Button, Card, Col, Row, Statistic} from "antd";
import {localFetch, Response} from "./api/fetch";

interface ParticipantProps {
    Character: string
    Name: string
}
enum RecommendReasonType {
    RECOMMEND_REASON_TYPE_TAG = 0,
    RECOMMEND_REASON_TYPE_MOVIE = 1,
    RECOMMEND_REASON_TYPE_LOG = 2,
    RECOMMEND_REASON_TYPE_TOP_K = 3
}
interface RecommendReasonProps {
    movie_reason: MovieProps
    tag_reason: string
    reason_type: RecommendReasonType
}

interface MovieProps {
    id: string
    title: string
    pic_url: string
    introduction?: string
    participants?: Array<ParticipantProps>
    release_date?: number
    language?: string
    reason?: RecommendReasonProps
    average_rating?: number
}
interface MovieRecommendResponse extends Response {
    movies: Array<MovieProps>
}

class MovieCard extends React.Component<any, any> {
    render() {
        const movieProps: MovieProps = this.props.movie;
        return (
            <><Card title={movieProps.title} hoverable style={{width: 300, height: 600, marginLeft:10, marginTop: 16}} loading={this.props.loading}
                      cover={<img alt={movieProps.title} style={{width:300, height:450}} src={movieProps.pic_url}/>}>
                <Row>
                    <Col span={12}>
                        <Statistic title="评分" value={movieProps.average_rating} suffix="/5"/>
                    </Col>
                    <Col span={12}>
                        <Button style={{marginTop: 16, float:"right"}} type="primary">查看详情</Button>
                    </Col>
                </Row>
                </Card>
            </>
        )
    }
}

class Main extends React.Component<any, any> {
    state = {
        page: {
            nPage: 0,
            nSize: 20,
        },
        movies: Array<MovieProps>(),
    };

    requestPageMovies = async () => {
        const page = {
            nPage: this.state.page.nPage + 1,
            nSize: this.state.page.nSize,
        };
        const movies = await localFetch.PostFetch<MovieRecommendResponse>("/movie/recommend", {
            "page": this.state.page.nPage,
            "offset": this.state.page.nSize,
        });
        this.setState({
            page: page,
        });

        return movies
    }

    componentDidMount = async () => {
        const firstPageMovies = await this.requestPageMovies();
        const movies = this.state.movies;
        this.setState({
            movies: movies.concat(firstPageMovies.movies),
        })
    }

    render() {
        return (
        <div>
                <Row gutter={16}>
                    {
                        this.state.movies.map((movieProp, i, a) => {
                            return <MovieCard movie={movieProp} key={movieProp.id}/>
                        })
                    }
                </Row>
        </div>
    )}
}

export {Main}