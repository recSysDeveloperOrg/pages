interface HttpRequest {
    PostFetch<R,P = {}>(url: string, params?: P): Promise<R>;
}

interface BaseResp {
    err_no?: number
    err_msg: string
}
interface Response {
    base_resp: BaseResp
}
enum ResponseStatus {
    StatusSuccess = 0,
    StatusFail = 1
}

const ResolveBaseResponse = <T extends Response> (resp: T) => {
    if (resp.base_resp.err_no === undefined) {
        return {
            status: ResponseStatus.StatusSuccess,
            msg: resp.base_resp.err_msg,
        }
    }

    return {
        status: ResponseStatus.StatusFail,
        msg: resp.base_resp.err_msg,
    }
}

class Fetch implements HttpRequest {
    readonly requestPrefix: string;
    constructor(public ip: string, public port: number, public version: number) {
        this.requestPrefix = `http://${ip}:${port}/v${version}`
    }

    public async PostFetch<R>(url: string, params: any): Promise<R> {
        const formData = new FormData();
        Object.keys(params).forEach((key: string) => {
            formData.append(key, params[key]);
        });
        const fetchOptions = {
            method: "POST",
            body: formData,
        }
        const path = `${this.requestPrefix}${url}`

        return await fetch(path, fetchOptions).then(r => r.ok ? r.json() : console.warn("fetch failed"))
            .catch(err => console.error(err));
    }

}

const localFetch = new Fetch("localhost", 8080, 1)
export {localFetch, ResolveBaseResponse, ResponseStatus};
export type { Response };
