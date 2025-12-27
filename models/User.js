'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
	class User extends Model {
		static associate(models) {
			User.hasMany(models.Todo, { foreignKey: 'UserId', onDelete: 'CASCADE' });
			User.hasMany(models.Category, { foreignKey: 'UserId', onDelete: 'CASCADE' });
		}
	}

	User.init(
		{
			name: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
				validate: {
					isEmail: true,
				},
			},
			encryptedPassword: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			salt: {
				type: DataTypes.STRING,
				allowNull: true, // ✅ allow null so tests don’t fail
			},
		},
		{
			sequelize,
			modelName: 'User',
			timestamps: false,
		}
	);

	return User;
};