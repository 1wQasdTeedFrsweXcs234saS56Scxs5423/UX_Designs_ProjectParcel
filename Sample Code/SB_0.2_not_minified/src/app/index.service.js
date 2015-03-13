'use strict';

angular.module('skillBuilder')
    .service('MainFactory', function() {
        return {
            assessmentRequestData: function() {
                return {
                    'mainHeading': 'Assessment Requests',
                    data: [{
                        'id': '1',
                        'name': 'Information Architecture',
                        'shortDescription': 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
                        'longDescription': 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque nihil perferendis ducimus illo deleniti quidem voluptatum harum in quo dicta, quasi, expedita, natus soluta repellat facere ad quis cupiditate temporibus.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque nihil perferendis ducimus illo deleniti quidem voluptatum harum in quo dicta, quasi, expedita, natus soluta repellat facere ad quis cupiditate temporibus.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque nihil perferendis ducimus illo deleniti quidem voluptatum harum in quo dicta, quasi, expedita, natus soluta repellat facere ad quis cupiditate temporibus.',
                        'status': 'incomplete',
                        'date': '26 DEC 2014'
                    }, {
                        'id': '2',
                        'name': 'Assessment 729 Skills',
                        'shortDescription': 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
                        'longDescription': 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque nihil perferendis ducimus illo deleniti quidem voluptatum harum in quo dicta, quasi, expedita, natus soluta repellat facere ad quis cupiditate temporibus.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque nihil perferendis ducimus illo deleniti quidem voluptatum harum in quo dicta, quasi, expedita, natus soluta repellat facere ad quis cupiditate temporibus.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque nihil perferendis ducimus illo deleniti quidem voluptatum harum in quo dicta, quasi, expedita, natus soluta repellat facere ad quis cupiditate temporibus.',
                        'status': 'complete',
                        'date': '26 DEC 2014'
                    }, {
                        'id': '3',
                        'name': 'Assessment QPT76 Skills',
                        'shortDescription': 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
                        'longDescription': 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque nihil perferendis ducimus illo deleniti quidem voluptatum harum in quo dicta, quasi, expedita, natus soluta repellat facere ad quis cupiditate temporibus.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque nihil perferendis ducimus illo deleniti quidem voluptatum harum in quo dicta, quasi, expedita, natus soluta repellat facere ad quis cupiditate temporibus.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque nihil perferendis ducimus illo deleniti quidem voluptatum harum in quo dicta, quasi, expedita, natus soluta repellat facere ad quis cupiditate temporibus.',
                        'status': 'incomplete',
                        'date': '26 DEC 2014'
                    }, {
                        'id': '4',
                        'name': 'Assessment QPT76 Skills',
                        'shortDescription': 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
                        'longDescription': 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque nihil perferendis ducimus illo deleniti quidem voluptatum harum in quo dicta, quasi, expedita, natus soluta repellat facere ad quis cupiditate temporibus.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque nihil perferendis ducimus illo deleniti quidem voluptatum harum in quo dicta, quasi, expedita, natus soluta repellat facere ad quis cupiditate temporibus.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque nihil perferendis ducimus illo deleniti quidem voluptatum harum in quo dicta, quasi, expedita, natus soluta repellat facere ad quis cupiditate temporibus.',
                        'status': 'complete',
                        'date': '26 DEC 2014'
                    }]
                };
            },
            aboutMeData: function() {
                return {
                    description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid quis nulla distinctio dolore minima ex reprehenderit a quidem sequi explicabo. Doloribus unde dicta odio? Provident delectus velit facere quis quam.',
                    other: 'test'
                };
            },
            myProfileData: function() {
                return {
                    'profileName': 'Rahul Singh',
                    'profileDesignation': 'Sr. UI/UX Designer',
                    'profileDepartment': 'Cisco Systems, Inc.',
                    'profileAddress': '201 3rd Street, Suite 620, San Francisco, California 94103, Phone: 925-223-1006',
                    'profileEmail': 'rahulsingh@cisco.com',
                    'profilePhone': '+91 9850332237',
                    'profiledLinkedIn': 'in.linkdin.com/in/rahulsingh/',
                    'profileImage': 'https://placehold.it/160'
                };
            },
            navbarData: function() {
                return {
                    'mainHeading': 'Skill Builder',
                    'notifications': '2'
                };
            },
            topRatedSkillsData: function() {
                return {
                    'mainHeading': 'Top Rated Skills',
                    data: [{
                        'image': 'sprite-photoshop-icon',
                        'skill': 'Adobe Photoshop',
                        'rating': '8',
                        'level': 'Expert',
                    }, {
                        'image': 'sprite-java',
                        'skill': 'JAVA',
                        'rating': '7',
                        'level': 'Novice',
                    }, {
                        'image': 'sprite-illustrator-icon',
                        'skill': 'Adobe Illustrator',
                        'rating': '7',
                        'level': 'Proficient',
                    }, {
                        'image': 'sprite-design-review',
                        'skill': 'Design Review',
                        'rating': '7',
                        'level': 'Novice',
                    }, {
                        'image': 'sprite-html-5-icon',
                        'skill': 'HTML 5.0',
                        'rating': '7',
                        'level': 'Novice',
                    }, {
                        'image': 'sprite-design-articulation',
                        'skill': 'Design Articulation',
                        'rating': '7',
                        'level': 'Novice',
                    }, {
                        'image': 'sprite-photoshop-icon',
                        'skill': 'Adobe Photoshop',
                        'rating': '8',
                        'level': 'Expert',
                    }, {
                        'image': 'sprite-java',
                        'skill': 'JAVA',
                        'rating': '7',
                        'level': 'Novice',
                    }, {
                        'image': 'sprite-illustrator-icon',
                        'skill': 'Adobe Illustrator',
                        'rating': '7',
                        'level': 'Proficient',
                    }, {
                        'image': 'sprite-design-review',
                        'skill': 'Design Review',
                        'rating': '7',
                        'level': 'Novice',
                    }, {
                        'image': 'sprite-html-5-icon',
                        'skill': 'HTML 5.0',
                        'rating': '7',
                        'level': 'Novice',
                    }, {
                        'image': 'sprite-design-articulation',
                        'skill': 'Design Articulation',
                        'rating': '7',
                        'level': 'Novice',
                    }]
                };
            }
        };
    });
