module.exports = (sequelize, Sequelize) => {
	const Status = sequelize.define(
		'Status',
		{
			name: {
				type: Sequelize.DataTypes.STRING,

				allowNull: false,
			},
		},
		{
			timestamps: false,
		}
	);

	return Status;
};

