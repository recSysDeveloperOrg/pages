import React, {Component} from "react";
import {Button, Card, Col, Descriptions, Drawer, Input, message, Modal, Row, Statistic, Table, Tag} from "antd";
import {localFetch, Response} from "./api/fetch";
import {MovieProps, recommendReasonType2Tip} from "./movie";
import DescriptionsItem from "antd/es/descriptions/Item";
import {Tag as TagEntity} from "./tag";

interface MovieRecommendResponse extends Response {
    movies: Array<MovieProps>
}
interface QueryMovieTopNTagResponse extends Response {
    tags: Array<TagEntity>
}

class MovieCard extends Component<any, any> {
    state = {
        visible: false,
        tags: Array<TagEntity>(),
    };

    openDrawer = async(movieID: string) => {
        const topNTagResp = await localFetch.PostFetch<QueryMovieTopNTagResponse>('/tag/movie-top-k', {
            n: 10,
            movieID: movieID,
        })
        for (const i in topNTagResp.tags) {
            topNTagResp.tags[i]['key'] = `${i}`;
        }
        if (topNTagResp.tags === undefined) {
            topNTagResp.tags = Array<TagEntity>();
        }
        this.setState({
            tags: topNTagResp.tags,
            visible: true,
        });
    }

    render() {
        const movieProps:MovieProps = this.props.movie;
        if (movieProps.participant) {
            for (const i in movieProps.participant) {
                movieProps.participant[i]['key'] = `${i}`;
            }
        }
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
        return (
            <><Card title={movieProps.title} hoverable style={{width: 300, height: 600, marginLeft:10, marginTop: 16}}
                    cover={<img alt={movieProps.title} style={{width:300, height:450}} src={movieProps.pic_url}/>}>
                <Row>
                    <Col span={12}>
                        <Statistic title="评分" value={movieProps.average_rating} suffix="/5"/>
                    </Col>
                    <Col span={12}>
                        <Button style={{marginTop: 16, float:"right"}} type="primary" onClick={() => this.openDrawer(movieProps.id)}>
                            查看详情
                        </Button>
                    </Col>
                </Row>
            </Card>

            <div>
                <Drawer width="88%" visible={this.state.visible} onClose={() => this.setState({visible: false})}>
                    <Descriptions title={movieProps.title} layout="vertical" bordered>
                        <DescriptionsItem label="上映日期">
                            {movieProps.release_date}
                        </DescriptionsItem>
                        <DescriptionsItem label="语言">
                            {movieProps.language}
                        </DescriptionsItem>
                        <DescriptionsItem label="电影均分">
                            {movieProps.average_rating}
                        </DescriptionsItem>
                        <DescriptionsItem label="简介">
                            {movieProps.introduction}
                        </DescriptionsItem>
                        <DescriptionsItem label="最多的10个标签">
                            {
                                this.state.tags.map((tag:TagEntity, i, a) => {
                                    return (
                                        <Tag color="orange" key={tag.key}>
                                            {tag.content}
                                        </Tag>
                                    )
                                })
                            }
                        </DescriptionsItem>
                    </Descriptions>
                    <Table style={{marginTop: 16}} columns={columns} dataSource={movieProps.participant}/>
                </Drawer>
            </div>
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

        // 开启页面监听
        window.addEventListener('scroll', this.handleScroll, false);
    }

    componentWillUnmount = () => {
        window.removeEventListener('scroll', this.handleScroll);
    }

    getScrollTop = () => {
        let scrollTop = 0, bodyScrollTop = 0, documentScrollTop = 0;
        if (document.body) {
            bodyScrollTop = document.body.scrollTop;
        }
        if (document.documentElement) {
            documentScrollTop = document.documentElement.scrollTop;
        }
        scrollTop = (bodyScrollTop - documentScrollTop > 0) ? bodyScrollTop : documentScrollTop;

        return scrollTop;
    }

    getScrollHeight = () => {
        let scrollHeight = 0, bodyScrollHeight = 0, documentScrollHeight = 0;
        if (document.body) {
            bodyScrollHeight = document.body.scrollHeight;
        }
        if (document.documentElement) {
            documentScrollHeight = document.documentElement.scrollHeight;
        }
        scrollHeight = (bodyScrollHeight - documentScrollHeight > 0) ? bodyScrollHeight : documentScrollHeight;
        return scrollHeight;
    }

    getWindowHeight = () => {
        let windowHeight = 0;
        if (document.compatMode === "CSS1Compat"){
            windowHeight = document.documentElement.clientHeight;
        } else{
            windowHeight = document.body.clientHeight;
        }
        return windowHeight;
    }

    handleScroll = async () => {
        if (this.getScrollHeight() - this.getScrollTop() - this.getWindowHeight() < 10) {
            window.removeEventListener('scroll', this.handleScroll, false);
            const moreMovies = await this.requestPageMovies();
            const movies = this.state.movies;
            if (moreMovies === undefined || moreMovies.movies === undefined || moreMovies.movies.length === 0) {
                message.warning("已经划到底部啦~");
                return;
            }
            this.setState({
                movies: movies.concat(moreMovies.movies),
            })
            setTimeout(() => window.addEventListener('scroll', this.handleScroll, false), 300);
        }
    }
    refreshMovieArray = async () => {
        await this.setState({
            page: {
                nPage: 0,
                nSize: 20,
            },
            movies: Array<MovieProps>(),
        });
        const firstPageMovies = await this.requestPageMovies();
        const movies = this.state.movies;
        this.setState({
            movies: movies.concat(firstPageMovies.movies),
        });
    }

    render() {
        return (
        <div>
            <User refreshMovie={this.refreshMovieArray}/>
            <Row gutter={16} style={{margin: "0 auto", width: "90%"}}>
                {
                    this.state.movies.map((movieProp, i, a) => {
                        return <MovieCard movie={movieProp} key={movieProp.id}/>
                    })
                }
            </Row>
        </div>
    )}
}

interface LoginResponse extends Response {
    access_token:string
    refresh_token:string
}

enum Gender {
    MALE = 0,
    FEMALE = 1,
    UNDEFINED = 999
}

interface User {
    id: string
    name: string
    gender: Gender
}

interface QueryResponse extends Response {
    user: User
    access_token?: string
}

class User extends Component<any, any> {
    state = {
        isLogin: false,
        accessToken: "",
        showLoginModal: false,
        inputs: {
            username: '',
            password: '',
        },
        user: {
            id: '',
            name: '',
            gender: undefined,
        },
    };

    async componentDidMount() {
        await this.queryUserByAccessToken();
    }

    handleLogin = () => {
        this.setState({
            showLoginModal: true,
        })
    }
    handleLogout = async() => {
        window.localStorage.removeItem('access_token');
        this.setState({
            isLogin: false,
        });
        await this.props.refreshMovie();
    }
    handleCancelLogin = () => {
        this.setState({
            showLoginModal: false,
        })
    }
    handleLoginSubmit = async () => {
        const username = this.state.inputs['username'];
        const password = this.state.inputs['password'];
        const loginResp = await localFetch.PostFetch<LoginResponse>('/user/login', {
            username, password,
        });
        const {base_resp, access_token, refresh_token} = loginResp;
        if (base_resp.err_no !== undefined) {
            message.error(base_resp.err_msg);
            return;
        }
        window.localStorage.setItem('access_token', access_token);
        window.localStorage.setItem('refresh_token', refresh_token);
        this.setState({
            isLogin: true,
            showLoginModal: false,
        });
        await this.queryUserByAccessToken();
        await this.props.refreshMovie();
    }
    handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const inputs = Object.assign(this.state.inputs, {
            [field]: e.target.value,
        });
        this.setState({inputs});
    }
    queryUserByAccessToken = async () => {
        const accessToken = window.localStorage.getItem('access_token');
        const queryUserResp = await localFetch.PostFetch<QueryResponse>('/user/', {
            accessToken,
        });
        if (queryUserResp.base_resp.err_no !== undefined) {
            message.error(queryUserResp.base_resp.err_msg);
            this.setState({isLogin: false});
            return;
        }
        this.setState({
            isLogin: true,
            user: queryUserResp.user,
        });
    }

    render() {
        return (
            <div>
                <div style={{marginTop: 16, float: "right"}}>
                    <Button type="primary" hidden={this.state.isLogin} onClick={() => this.handleLogin()}>
                        登录
                    </Button>
                    <span hidden={!this.state.isLogin}>
                        {this.state.user.name}
                    </span>
                    <Button type="primary" hidden={!this.state.isLogin} onClick={() => this.handleLogout()}>
                        登出
                    </Button>
                </div>

                <Modal title="登录" visible={this.state.showLoginModal}
                       onOk={() => this.handleLoginSubmit()}
                       onCancel={() => this.handleCancelLogin()}>
                    <Input size="large" placeholder="用户名"
                    onChange={e => this.handleInputChange(e, 'username')}/>
                    <Input style={{marginTop: 12}} size="large" placeholder="密码"
                    onChange={e => this.handleInputChange(e, 'password')}/>
                </Modal>
            </div>
        )
    }
}

export {Main}