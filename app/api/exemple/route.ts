import { type NextRequest, NextResponse } from "next/server"
import { number } from "zod"

export async function GET(request: NextRequest) {
    // Return a simple JSON response
    
    const data = {
        message: "Hello from the example API route!",
        number: 42,
        status: "success",
        simple_items: ["item1", "item2", "item3"],
        nested_object: {
            key1: "value1",
            key2: "value2",
            key3: {
                subkey1: "subvalue1",
                subkey2: 123,
            },
        },
        is_active: true,
        count: number().min(0).max(100).parse(10),
        items_list: [
            {
                id: 1,
                name: "Item One",
                details: {
                    description: "This is the first item",
                    price: 9.99,
                },
                size: 10
            },
            {
                id: 2,
                name: "Item Two",
                details: {
                    description: "This is the second item",
                    price: 19.99,
                },
                size: 20
            },
            {
                id: 3,
                name: "Item Three",
                details: {
                    description: "This is the third item",
                    price: 9.99,
                },
                size: 2
            },
            {
                id: 4,
                name: "Item Four",
                details: {
                    description: "This is the fourth item",
                    price: 29.99,
                },
                size: 15
            },
            {
                id: 5,
                name: "Item Five",
                details: {
                    description: "This is the fifth item",
                    price: 7.99,
                },
                size: 4
            },
            {
                id: 6,
                name: "Item Six",
                details: {
                    description: "This is the sixth item",
                    price: 14.99,
                },
                size: 30
            },
            {
                id: 7,
                name: "Item Seven",
                details: {
                    description: "This is the seventh item",
                    price: 24.99,
                },
                size: 8
            },
            {
                id: 8,
                name: "Item Eight",
                details: {
                    description: "This is the eighth item",
                    price: 11.99,
                },
                size: 12
            },
            {
                id: 9,
                name: "Item Nine",
                details: {
                    description: "This is the ninth item",
                    price: 17.99,
                },
                size: 6
            },
            {
                id: 10,
                name: "Item Ten",
                details: {
                    description: "This is the tenth item",
                    price: 5.99,
                },
                size: 25
            },
            {
                id: 11,
                name: "Item Eleven",
                details: {
                    description: "This is the eleventh item",
                    price: 13.99,
                },
                size: 18
            }
        ],
        kpi_list: [
            { label: "Total Sales", date: 2025, value: 1500 },
            { label: "Total Sales", date: 2024, value: 300 },
            { label: "Total Sales", date: 2023, value: 75 },
        ],
    }
    return NextResponse.json(data)
}