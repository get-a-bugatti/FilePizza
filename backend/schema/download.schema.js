import {z} from "zod";
export const downloadSchema = z.object({
    params: z.object({
        id: z.uuid()
    })
})