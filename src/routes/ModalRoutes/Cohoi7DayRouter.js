import React from 'react';

const Cohoi7DayRouter = [
  {
    path: 'cohoi7Day.edit',
    Component: React.lazy(() => import('containers/Cohoi7Day')),
    modalOptions: { title: '', width: 750 }
  }
];

export default Cohoi7DayRouter;