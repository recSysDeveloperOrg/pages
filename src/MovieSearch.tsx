import {Component} from "react";
import Search from "antd/es/input/Search";
import {Response} from "./api/fetch";
import {MovieProps} from "./movie";
import {Switch} from "antd";

enum MovieSearchEntryType {
    MOVIE_SEARCH_ENTRY_TYPE_TITLE = 1,
    MOVIE_SEARCH_ENTRY_TYPE_DETAIL = 2
}

interface MovieSearchEntry {
    ms_entry_type: MovieSearchEntryType
    movie: MovieProps
}

interface MovieSearchResponse extends Response{
    movies: Array<MovieSearchEntry>
}

class MovieSearch extends Component<any, any> {
    state = {
        searchContent: '',
        page: 0,
        offset: 20,
        showSearch: false,
        isSearchRequested: false,
    }

    handleSearchContentChange = (e:any) => {
        const state = {
            ...this.state,
            searchContent: e.target.value,
        };
        this.setState({
            ...state,
        });
    }

    handleSwitchStateChange = (e: boolean) => {
        if (!e && this.state.isSearchRequested) {
            this.props.stopRenderSearchMovies();
        }
        const state = {
            ...this.state,
            showSearch: e,
            isSearchRequested: false,
        };
        this.setState({
            ...state,
        });
    }
    handleOnSearch = () => {
        this.props.renderSearchMovies(this.state.searchContent);
        const state = {
            ...this.state,
            isSearchRequested: true,
        };
        this.setState({
            ...state,
        });
    }

    render() {
        return (
            <div>
                <Switch style={{display:"block", margin:"0 auto"}}
                        checkedChildren="已开启"
                        unCheckedChildren="开始搜索"
                        defaultChecked={false}
                        onChange={this.handleSwitchStateChange}/>
                <div hidden={!this.state.showSearch}>
                    <Search style={{marginBottom: 8, marginTop: 8}} placeholder="搜索电影"
                            onChange={this.handleSearchContentChange}
                            onSearch={() => this.handleOnSearch()}/>
                </div>
            </div>
        )
    }
}

export {MovieSearch, MovieSearchEntryType};
export type { MovieSearchEntry , MovieSearchResponse };
