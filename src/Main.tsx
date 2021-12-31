import React, {Component} from "react";
import {
    Button,
    Card,
    Col,
    Input,
    message,
    Modal, Radio,
    Row,
    Statistic,
} from "antd";
import {localFetch, Response} from "./api/fetch";
import {MovieProps, ParticipantProps} from "./movie";
import {Tag as TagEntity} from "./tag";
import MovieDetail from "./MovieDetail";
import {MovieSearch, MovieSearchResponse} from "./MovieSearch";

interface MovieRecommendResponse extends Response {
    movies: Array<MovieProps>
}
interface MovieDetailResponse extends Response {
    movie: MovieProps
}
interface TopKTagResponse extends Response {
    tags: Array<TagEntity>
}
interface UserMovieRatingResponse extends Response {
    movie_id2_personal_rating: Map<string, number>
}

class MovieCard extends Component<any, any> {
    defaultState = {
        visible: false,
        movie: {
            id: '',
            title: '',
            pic_url: '',
            introduction: '',
            participant: Array<ParticipantProps>(),
            release_date: 0,
            language: '',
            reason: undefined,
            average_rating: 0,
        },
        tags: Array<TagEntity>(),
        userRating: 0,
    };

    state = {
        first: {
            ...this.defaultState,
        },
        second: {
            ...this.defaultState,
        },
    };

    openDrawer = async(movie: MovieProps, drawerID: string) => {
        const movieID = movie.id;
        // 需要给getMovieDetail发一次请求记录历史记录
        const movieDetail = await localFetch.PostFetch<MovieDetailResponse>(`/movie/${movieID}`, {});
        movieDetail.movie.reason = movie.reason;

        const topNTagResp = await localFetch.PostFetch<TopKTagResponse>('/tag/movie-top-k', {
            n: 10,
            movieID: movieID,
        });
        for (const i in topNTagResp.tags) {
            topNTagResp.tags[i]['key'] = `${i}`;
        }
        if (movieDetail.movie.participant) {
            for (const i in movieDetail.movie.participant) {
                movieDetail.movie.participant[i]['key'] = `${i}`;
            }
        }
        if (topNTagResp.tags === undefined) {
            topNTagResp.tags = Array<TagEntity>();
        }

        const ratingResp = await localFetch.PostFetch<UserMovieRatingResponse>('/rate/movie', {
            movieIDs: [movieID],
        });
        let userRating;
        if (ratingResp.movie_id2_personal_rating !== undefined) {
            for (const mid in ratingResp.movie_id2_personal_rating) {
                // @ts-ignore
                userRating = ratingResp.movie_id2_personal_rating[mid];
            }
        }
        const drawer = {
            // @ts-ignore
            ...this.state[drawerID],
            movie: movieDetail.movie,
            tags: topNTagResp.tags,
            visible: true,
            userRating: userRating,
        };
        this.setState({
            [drawerID]: drawer,
        });
    }

    closeDrawer = (drawerID: string) => {
        const drawer = {
            // @ts-ignore
            ...this.state[drawerID],
            visible: false,
        }
        this.setState({
            [drawerID]: drawer,
        })
    }

    showSourceMovieDetail = async (movieID: string) => {
        await this.openDrawer({
            id: movieID,
            title: '',
            pic_url: '',
            introduction: '',
        }, "second");
    }

    handleRateChange = async(e: number, movieID: string, drawerID: string) => {
        const rateResp = await localFetch.PostFetch<Response>('/rate/', {
            rating: e,
            movieID: movieID,
        });
        if (rateResp.base_resp.err_no !== undefined) {
            message.error(rateResp.base_resp.err_msg);
            return;
        }
        const drawer = {
            // @ts-ignore
            ...this.state[drawerID],
            userRating: e,
        }
        this.setState({
            [drawerID]: drawer,
        });
    }

    render() {
        const movieProps:MovieProps = this.props.movie;
        if (movieProps.participant) {
            for (const i in movieProps.participant) {
                movieProps.participant[i]['key'] = `${i}`;
            }
        }

        return (
            <><Card title={movieProps.title} hoverable style={{width: 300, height: 600, marginLeft:10, marginTop: 16}}
                    cover={<img alt={movieProps.title} style={{width:300, height:450}} src={movieProps.pic_url}/>}>
                <Row>
                    <Col span={12}>
                        <Statistic title="评分" value={movieProps.average_rating?.toFixed(1)}/>
                    </Col>
                    <Col span={12}>
                        <Button style={{marginTop: 16, float:"right"}} type="primary" onClick={() => this.openDrawer(movieProps, "first")}>
                            查看详情
                        </Button>
                    </Col>
                </Row>
                <MovieDetail tags={this.state.first.tags}
                             movie={this.state.first.movie}
                             visible={this.state.first.visible}
                             userRating={this.state.first.userRating} onClose={() => this.closeDrawer("first")}
                             showSourceMovieDetail={(movieID: string) => this.showSourceMovieDetail(movieID)}
                             onRateChange={(e: number, movieID: string) => this.handleRateChange(e, movieID, "first")}/>
                <MovieDetail tags={this.state.second.tags}
                             movie={this.state.second.movie}
                             visible={this.state.second.visible}
                             userRating={this.state.second.userRating} onClose={() => this.closeDrawer("second")}
                             showSourceMovieDetail={(movieID: string) => this.showSourceMovieDetail(movieID)}
                             onRateChange={(e: number, movieID: string) => this.handleRateChange(e, movieID, "second")}/>
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
        renderHistory: {
            page: 0,
            size: 20,
            movies: Array<MovieProps>(),
        },
        isInSearchMode: false,
        searchKeyword: undefined,
    };

    requestPageMovies = async () => {
        const page = {
            nPage: this.state.page.nPage + 1,
            nSize: this.state.page.nSize,
        };
        let movies:Array<MovieProps> = new Array<MovieProps>();
        if (this.state.isInSearchMode) {
            const searchResponse = await localFetch.PostFetch<MovieSearchResponse>("/movie/search", {
                "page": this.state.page.nPage,
                "offset": this.state.page.nSize,
                "keyword": this.state.searchKeyword,
            });
            if (searchResponse.movies) {
                movies = searchResponse.movies.map(x => x.movie);
            }
        }else {
            const recommendResponse = await localFetch.PostFetch<MovieRecommendResponse>("/movie/recommend", {
                "page": this.state.page.nPage,
                "offset": this.state.page.nSize,
            });
            movies = recommendResponse.movies;
        }
        this.setState({
            ...this.state,
            page: page,
        });

        return movies
    }

    componentDidMount = async () => {
        const firstPageMovies = await this.requestPageMovies();
        const movies = this.state.movies;
        this.setState({
            ...this.state,
            movies: movies.concat(firstPageMovies),
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
            if (moreMovies === undefined || moreMovies.length === 0) {
                message.warning("已经划到底部啦~");
                return;
            }
            this.setState({
                ...this.state,
                movies: movies.concat(moreMovies),
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
            ...this.state,
            movies: movies.concat(firstPageMovies),
        });
    }
    renderSearchMovies = async (keyword: string) => {
        const renderHistory = this.state.isInSearchMode ? this.state.renderHistory : {
            page: this.state.page.nPage,
            size: this.state.page.nSize,
            movies: this.state.movies,
        };
        const state = {
            movies: new Array<MovieProps>(),
            searchKeyword: keyword,
            renderHistory: renderHistory,
            page: {
              nPage: 0,
              nSize: 20,
            },
            isInSearchMode: true,
        };
        await this.setState({
            ...state,
        });
        const firstPageSearchMovies = await this.requestPageMovies();
        this.setState({
            ...this.state,
            movies: firstPageSearchMovies,
        });
    }
    stopRenderSearchMovies = () => {
        const state = {
            movies: this.state.renderHistory.movies,
            page: {
                nPage: this.state.renderHistory.page,
                nSize: this.state.renderHistory.size,
            },
            isInSearchMode: false,
        };
        this.setState({
            ...state,
        });
    }

    render() {
        return (
        <div>
            <div style={{height: 55}}>
                <User refreshMovie={this.refreshMovieArray}/>
            </div>
            <MovieSearch renderSearchMovies={(keyword: string) => this.renderSearchMovies(keyword)}
                         stopRenderSearchMovies={() => this.stopRenderSearchMovies()}/>
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
        showRegisterModal: false,
        genderValue: 1,
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
    handleRegister = () => {
        const state = {
            ...this.state,
            showRegisterModal: true,
        };
        this.setState({
            ...state,
        });
    }
    handleGenderChange = (e:any) => {
        const state = {
            ...this.state,
            genderValue: e.target.value,
        };
        this.setState({
            ...state,
        });
    }
    handleCancelRegister = () => {
        const state = {
            ...this.state,
            showRegisterModal: false,
        };
        this.setState({
            ...state,
        });
    }
    handleRegisterSubmit = async () => {
        const genderSelection2English = {
            1: "MALE",
            2: "FEMALE",
        };
        const registerResp = await localFetch.PostFetch<Response>('/user/register', {
            username: this.state.inputs.username,
            password: this.state.inputs.password,
            // @ts-ignore
            gender: genderSelection2English[this.state.genderValue],
        });
        if (registerResp.base_resp.err_no !== undefined) {
            message.error(registerResp.base_resp.err_msg);
            return;
        }
        message.success("注册成功~");
        const state = {
            ...this.state,
            showRegisterModal: false,
        };
        this.setState({
            ...state,
        });
    }

    render() {
        return (
            <div>
                <div style={{marginTop: 16, float: "right"}}>
                    <Button type="primary" hidden={this.state.isLogin} onClick={() => this.handleLogin()}>
                        登录
                    </Button>
                    <Button type="primary" style={{marginLeft: 8}} hidden={this.state.isLogin} onClick={() => this.handleRegister()}>
                        注册
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
                <Modal title="注册" visible={this.state.showRegisterModal}
                       onOk={() => this.handleRegisterSubmit()}
                       onCancel={() => this.handleCancelRegister()}>
                    <Input size="large" placeholder="用户名"
                           onChange={e => this.handleInputChange(e, 'username')}/>
                    <Input style={{marginTop: 12}} size="large" placeholder="密码"
                           onChange={e => this.handleInputChange(e, 'password')}/>
                    <Radio.Group onChange={this.handleGenderChange} value={this.state.genderValue}>
                        <Radio value={1}>男</Radio>
                        <Radio value={2}>女</Radio>
                    </Radio.Group>
                </Modal>
            </div>
        )
    }
}

export {Main}