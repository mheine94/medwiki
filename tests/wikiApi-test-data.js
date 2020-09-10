module.exports = {
    data:{
        sameInn:{
            input: [
                {
                    query: "Nurofen",
                    result: {
                        
                            "inn": "ibuprofen",
                            "ingredientClass": [
                                "Nichtsteroidales Antirheumatikum"
                            ],
                            "tradenames": [
                                "Nurofen"
                            ],
                            "formula": [
                                "C13H18O2"
                            ],
                            "cas": [
                                "15687-27-1"
                            ],
                            "atc": [
                                "M02AA13",
                                "M01AE01",
                                "C01EB16",
                                "G02CC01"
                            ]
                     }
                    },
                {
                    query:"Ibuhexal",
                    result:
                        {
                            "inn": "ibuprofen",
                            "ingredientClass": [
                                "Nichtsteroidales Antirheumatikum"
                            ],
                            "tradenames": [
                                "Ibuhexal"
                            ],
                            "formula": [
                                "C13H18O2"
                            ],
                            "cas": [
                                "15687-27-1"
                            ],
                            "atc": [
                                "M02AA13",
                                "M01AE01",
                                "C01EB16",
                                "G02CC01"
                            ]
                        }
                }
            ],
            output:{
                "ibuprofen": {
                    "inn": "ibuprofen",
                    "ingredientClass": [
                        "Nichtsteroidales Antirheumatikum"
                    ],
                    "tradenames": [
                        "Nurofen",
                        "Ibuhexal"
                    ],
                    "formula": [
                        "C13H18O2"
                    ],
                    "cas": [
                        "15687-27-1"
                    ],
                    "atc": [
                        "M02AA13",
                        "M01AE01",
                        "C01EB16",
                        "G02CC01"
                    ]
                }
            }
        },
        diffrentInn:{
            input:[
                {
                    query:"Nurofen",
                    result:{
                        "inn": "ibuprofen",
                        "ingredientClass": [
                            "Nichtsteroidales Antirheumatikum"
                        ],
                        "tradenames": [
                            "Nurofen"
                        ],
                        "formula": [
                            "C13H18O2"
                        ],
                        "cas": [
                            "15687-27-1"
                        ],
                        "atc": [
                            "M02AA13",
                            "M01AE01",
                            "C01EB16",
                            "G02CC01"
                        ]
                    }
                },
                {

                    query:"Amocicillin",
                    result: {
                        "inn": "amoxicillin",
                        "ingredientClass": [
                            "β-Lactam-Antibiotika"
                        ],
                        "tradenames": [],
                        "formula": [
                            "C16H19N3O5S"
                        ],
                        "cas": [
                            "26787-78-0",
                            "61336-70-7 (Amoxicillin-Trihydrat)",
                            "34642-77-8 (Amoxicillin-Natrium)"
                        ],
                        "atc": [
                            "J01CA04"
                        ]
                    }

                }
            ],
            output:{
                "ibuprofen": {
                    "inn": "ibuprofen",
                    "ingredientClass": [
                        "Nichtsteroidales Antirheumatikum"
                    ],
                    "tradenames": [
                        "Nurofen"
                    ],
                    "formula": [
                        "C13H18O2"
                    ],
                    "cas": [
                        "15687-27-1"
                    ],
                    "atc": [
                        "M02AA13",
                        "M01AE01",
                        "C01EB16",
                        "G02CC01"
                    ]
                },
                "amoxicillin": {
                    "inn": "amoxicillin",
                    "ingredientClass": [
                        "β-Lactam-Antibiotika"
                    ],
                    "tradenames": [],
                    "formula": [
                        "C16H19N3O5S"
                    ],
                    "cas": [
                        "26787-78-0",
                        "61336-70-7 (Amoxicillin-Trihydrat)",
                        "34642-77-8 (Amoxicillin-Natrium)"
                    ],
                    "atc": [
                        "J01CA04"
                    ]
                }
            }
        },
        unknownInn:
            {
            input:[
                {
                    query:"Dasistkeinmedikament",
                    result:{
                        error: "Nothing was found on wikipedia",
                        query: "Dasistkeinmedikament"
                    }
                }
            ],
            output:{
                    "unknown": [
                      "Dasistkeinmedikament"
                    ] 
            }
        },
        unknownInnAndKnown:{
            input:[
                {
                    query:"Dasistkeinmedikament",
                    result:{
                        error: "Nothing was found on wikipedia",
                        query: "Dasistkeinmedikament"
                    }
                },
                {
                    query: "Amoxicillin",
                    result:{
                        "inn": "amoxicillin",
                        "ingredientClass": [
                            "β-Lactam-Antibiotika"
                        ],
                        "tradenames": [],
                        "formula": [
                            "C16H19N3O5S"
                        ],
                        "cas": [
                            "26787-78-0",
                            "61336-70-7 (Amoxicillin-Trihydrat)",
                            "34642-77-8 (Amoxicillin-Natrium)"
                        ],
                        "atc": [
                            "J01CA04"
                        ]
                    }
                }
            ],
            output:{
                "unknown": [
                "Dasistkeinmedikament"
                ],
                "amoxicillin": {
                    "inn": "amoxicillin",
                    "ingredientClass": [
                        "β-Lactam-Antibiotika"
                    ],
                    "tradenames": [],
                    "formula": [
                        "C16H19N3O5S"
                    ],
                    "cas": [
                        "26787-78-0",
                        "61336-70-7 (Amoxicillin-Trihydrat)",
                        "34642-77-8 (Amoxicillin-Natrium)"
                    ],
                    "atc": [
                        "J01CA04"
                    ]
                }
            }
        }
    }
}