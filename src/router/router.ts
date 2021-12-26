import {Main} from "../Main";

interface router {
    path: string
    component: any
    children?: Array<router>
}

const routers: Array<router> = [
    {
        path: "/main",
        component: Main,
    }
]

export default routers