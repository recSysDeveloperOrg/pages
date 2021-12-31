import {Tag, Input, Tooltip, message, Dropdown, Menu} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import React from "react";
import {localFetch, Response} from "./api/fetch";
import {Tag as TagEntity} from "./tag";

interface QueryTagResponse extends Response {
    tags: Array<TagEntity>
}

class EditableTagGroup extends React.Component<any, any> {
    constructor(props: { movieID: string }) {
        super(props);
        this.state = {
            tags: Array<TagEntity>(),
            tagCloud: Array<TagEntity>(),
            inputVisible: false,
            inputValue: '',
            editInputIndex: -1,
            editInputValue: '',
        };
    }

    async refreshTags() {
        const movieID: string = this.props.movieID;
        const myTags = await localFetch.PostFetch<QueryTagResponse>('/tag/user-movie-tags', {
            movieID,
        });
        const myTagCloud = await localFetch.PostFetch<QueryTagResponse>('/tag/user-tag-cloud', {
            n: 10,
        });
        for (const i in myTags.tags) {
            myTags.tags[i]['key'] = `${i}`;
        }
        for (const i in myTagCloud.tags) {
            myTagCloud.tags[i]['key'] = `${i}`;
        }
        if (myTags.tags === undefined) {
            myTags.tags = Array<TagEntity>();
        }
        if (myTagCloud.tags === undefined) {
            myTagCloud.tags = Array<TagEntity>();
        }
        this.setState({
            ...this.state,
            tags: myTags.tags,
            tagCloud: myTagCloud.tags,
            inputVisible: false,
            inputValue: '',
        });
    }

    async componentDidMount() {
        await this.refreshTags();
    }

    showInput = () => {
        this.setState({ inputVisible: true }, () => this.input.focus());
    };

    handleInputChange = (e: { target: { value: any; }; }) => {
        this.setState({ inputValue: e.target.value });
    };

    handleInputConfirm = async () => {
        const movieID = this.props.movieID;
        const {inputValue} = this.state;
        const createTagResponse = await localFetch.PostFetch<Response>('/tag/', {
            movieID: movieID,
            tag: inputValue,
        })
        if (createTagResponse.base_resp.err_no !== undefined) {
            message.error(createTagResponse.base_resp.err_msg);
            return;
        }
        await this.refreshTags();
    };

    handleEditInputChange = (e: { target: { value: any; }; }) => {
        this.setState({ editInputValue: e.target.value });
    };

    handleEditInputConfirm = () => {
        // @ts-ignore
        this.setState(({ tags, editInputIndex, editInputValue }) => {
            const newTags = [...tags];
            newTags[editInputIndex] = editInputValue;

            return {
                tags: newTags,
                editInputIndex: -1,
                editInputValue: '',
            };
        });
    };

    saveInputRef = (input: any) => {
        this.input = input;
    };

    saveEditInputRef = (input: any) => {
        this.editInput = input;
    };
    private input: any;
    private editInput: any;

    render() {
        const { tags, tagCloud, inputVisible, inputValue, editInputIndex, editInputValue } = this.state;
        const userTagCloud = (
            <Menu>
                {
                    tagCloud.map((x: TagEntity) => {
                        return (
                            <Menu.Item key={x.key}>
                                {x.content}
                            </Menu.Item>
                        )
                    })
                }
            </Menu>
        );
        return (
            <>
                {tags.map((tag:TagEntity, index: number) => {
                    if (editInputIndex === index) {
                        return (
                            <Input
                                ref={this.saveEditInputRef}
                                key={tag.id}
                                size="small"
                                className="tag-input"
                                value={editInputValue}
                                onChange={this.handleEditInputChange}
                                onBlur={this.handleEditInputConfirm}
                                onPressEnter={this.handleEditInputConfirm}
                            />
                        );
                    }

                    const isLongTag = tag.content.length > 20;

                    const tagElem = (
                        <Tag
                            className="edit-tag"
                            key={tag.id}
                            closable={false}
                        >
              <span>
                {isLongTag ? `${tag.content.slice(0, 20)}...` : tag.content}
              </span>
                        </Tag>
                    );
                    return isLongTag ? (
                        <Tooltip title={tag.content} key={tag.id}>
                            {tagElem}
                        </Tooltip>
                    ) : (
                        tagElem
                    );
                })}
                {inputVisible && (
                    <Input
                        ref={this.saveInputRef}
                        type="text"
                        size="small"
                        className="tag-input"
                        value={inputValue}
                        onChange={this.handleInputChange}
                        onBlur={this.handleInputConfirm}
                        onPressEnter={this.handleInputConfirm}
                    />
                )}
                {!inputVisible && (
                    <Dropdown overlay={userTagCloud} placement="bottomCenter">
                        <Tag className="site-tag-plus" onClick={this.showInput}>
                            <PlusOutlined /> 新增标签
                        </Tag>
                    </Dropdown>
                )}
            </>
        );
    }
}

export default EditableTagGroup;