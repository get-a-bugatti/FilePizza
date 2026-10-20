export const downloadSchema = z.object({
    params: z.object({
        id: z.uuid()
    })
})