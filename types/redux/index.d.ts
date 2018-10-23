
import {StoreEnhancer} from "redux";

declare module "redux" {
    export type GenericStoreEnhancer = any;
}