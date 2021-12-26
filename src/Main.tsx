import React, {Component} from "react";
import {Button, Card, Col, Descriptions, Drawer, Input, message, Modal, Row, Statistic, Table} from "antd";
import {localFetch, Response} from "./api/fetch";
import {MovieProps, recommendReasonType2Tip} from "./movie";
import DescriptionsItem from "antd/es/descriptions/Item";

interface MovieRecommendResponse extends Response {
    movies: Array<MovieProps>
}

class MovieCard extends Component<any, any> {
    state = {
        visible: false,
    };

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
                        <Button style={{marginTop: 16, float:"right"}} type="primary" onClick={() => this.setState({visible: true})}>
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
                        <DescriptionsItem label="参演演员列表">
                            <Table columns={columns} dataSource={movieProps.participant}/>
                        </DescriptionsItem>
                    </Descriptions>
                    {movieProps.reason?.reason_type ? `该电影基于${recommendReasonType2Tip.get(movieProps.reason.reason_type)}推荐`: ''}
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

    render() {
        return (
        <div>
            <User/>
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

class User extends Component<any, any> {
    state = {
        isLogin: false,
        accessToken: "",
        showLoginModal: false,
        inputs: {
            username: '',
            password: '',
        },
    };

    handleLogin = () => {
        this.setState({
            showLoginModal: true,
        })
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

    }
    handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const inputs = Object.assign(this.state.inputs, {
            [field]: e.target.value,
        })
        this.setState({inputs});
    }

    render() {
        return (
            <div>
                <div style={{marginTop: 16, float: "right"}}>
                    <Button type="primary" hidden={this.state.isLogin} onClick={() => this.handleLogin()}>
                        登录
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